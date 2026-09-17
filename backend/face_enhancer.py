import os
import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any
from PIL import Image

try:
    import onnxruntime as ort
    HAS_ORT = True
except ImportError:
    HAS_ORT = False

from config import MODELS_DIR

# Tọa độ 5 điểm mốc chuẩn trên khuôn mặt 512x512 (FFHQ standard landmarks)
FFHQ_LANDMARKS_512 = np.array([
    [192.98138, 239.94708],  # Mắt phải
    [318.90277, 240.20436],  # Mắt trái
    [256.05902, 314.01935],  # Đỉnh mũi
    [201.26117, 371.41043],  # Khóe miệng phải
    [313.08905, 371.15118]   # Khóe miệng trái
], dtype=np.float32)

GFPGAN_URL = "https://huggingface.co/Neus/GFPGANv1.4/resolve/main/GFPGANv1.4.onnx"

class FaceRestorer:
    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = models_dir
        self.yunet_path = self.models_dir / "face_detection_yunet_2023mar.onnx"
        self.gfpgan_path = self.models_dir / "GFPGANv1.4.onnx"
        
        self.detector = None
        self.gfpgan_session = None
        self._init_models()

    def _init_models(self):
        # 1. Khởi tạo YuNet Face Detector
        if self.yunet_path.exists():
            try:
                # Kích thước ban đầu 320x320, sẽ tự động resize theo ảnh
                self.detector = cv2.FaceDetectorYN.create(
                    str(self.yunet_path), "", (320, 320), 0.35, 0.3, 5000
                )
            except Exception as e:
                print(f"[FaceRestorer] Warning initializing YuNet: {e}")

        # 2. Khởi tạo GFPGAN ONNX Session với DirectML / CPU
        if HAS_ORT and self.gfpgan_path.exists():
            self._init_gfpgan_session()

    def _init_gfpgan_session(self):
        if not HAS_ORT or not self.gfpgan_path.exists():
            return False
        try:
            available = ort.get_available_providers()
            providers = []
            if "DmlExecutionProvider" in available:
                providers.append("DmlExecutionProvider")
            if "CPUExecutionProvider" in available:
                providers.append("CPUExecutionProvider")
            
            sess_opts = ort.SessionOptions()
            sess_opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            self.gfpgan_session = ort.InferenceSession(
                str(self.gfpgan_path), sess_options=sess_opts, providers=providers
            )
            print(f"[FaceRestorer] GFPGAN ONNX loaded with providers: {self.gfpgan_session.get_providers()}")
            return True
        except Exception as e:
            print(f"[FaceRestorer] Error loading GFPGAN ONNX: {e}")
            return False

    def download_model_if_missing(self) -> bool:
        """Tự động tải GFPGAN ONNX nếu chưa có trong thư mục models"""
        if self.gfpgan_path.exists():
            if self.gfpgan_session is None:
                return self._init_gfpgan_session()
            return True

        print(f"[FaceRestorer] Model GFPGANv1.4.onnx chưa tồn tại. Đang tải tự động từ HuggingFace...")
        temp_path = self.gfpgan_path.with_suffix(".tmp")
        try:
            import urllib.request
            self.models_dir.mkdir(parents=True, exist_ok=True)
            req = urllib.request.Request(GFPGAN_URL, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as resp, open(temp_path, "wb") as f:
                total_size = int(resp.headers.get("Content-Length", 0))
                downloaded = 0
                chunk_size = 1024 * 1024
                while True:
                    chunk = resp.read(chunk_size)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        pct = (downloaded / total_size) * 100
                        print(f"\r[FaceRestorer] Đang tải GFPGAN ONNX: {downloaded / (1024*1024):.1f}MB / {total_size / (1024*1024):.1f}MB ({pct:.1f}%)", end="")
                print("\n[FaceRestorer] Tải thành công GFPGAN ONNX model!")
            temp_path.rename(self.gfpgan_path)
            return self._init_gfpgan_session()
        except Exception as e:
            print(f"\n[FaceRestorer] Không thể tải GFPGAN ONNX: {e}")
            if temp_path.exists():
                temp_path.unlink()
            return False


    @property
    def is_ready(self) -> bool:
        return self.detector is not None and self.gfpgan_session is not None

    def detect_faces(self, img_bgr: np.ndarray) -> List[Dict[str, Any]]:
        if self.detector is None:
            return []

        h, w = img_bgr.shape[:2]
        self.detector.setInputSize((w, h))
        _, faces = self.detector.detect(img_bgr)

        if faces is None or len(faces) == 0:
            return []

        results = []
        for f in faces:
            bbox = f[0:4].astype(int)
            # 5 landmarks: right_eye, left_eye, nose, right_mouth, left_mouth
            landmarks = f[4:14].reshape((5, 2)).astype(np.float32)
            score = float(f[14])
            results.append({
                "bbox": bbox,
                "landmarks": landmarks,
                "score": score
            })
        return results

    def _align_crop(self, img_bgr: np.ndarray, landmarks: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Căn chỉnh khuôn mặt về chuẩn 512x512 bằng phép biến đổi Affine
        """
        # Tính toán ma trận biến đổi Affine từ 5 điểm mốc của ảnh sang 5 điểm mốc chuẩn FFHQ
        affine_matrix, _ = cv2.estimateAffinePartial2D(landmarks, FFHQ_LANDMARKS_512, method=cv2.LMEDS)
        if affine_matrix is None:
            # Fallback nếu không tính được
            center = (float(np.mean(landmarks[:, 0])), float(np.mean(landmarks[:, 1])))
            affine_matrix = cv2.getRotationMatrix2D(center, 0, 1.0)
            affine_matrix[:, 2] += [256 - center[0], 256 - center[1]]

        aligned_face = cv2.warpAffine(
            img_bgr, affine_matrix, (512, 512),
            flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT_101
        )
        return aligned_face, affine_matrix

    def _generate_feather_mask(self) -> np.ndarray:
        """Tạo mặt nạ Gaussian chuyển tiếp mềm mại hình bầu dục để ghép không lộ viền"""
        mask = np.zeros((512, 512), dtype=np.float32)
        center = (256, 270)
        axes = (180, 220)
        cv2.ellipse(mask, center, axes, 0, 0, 360, 1.0, -1)
        # Làm nhòe viền mặt nạ sâu để chuyển tiếp mượt mà
        mask = cv2.GaussianBlur(mask, (101, 101), 30)
        return mask

    def restore_face_crop(self, face_bgr: np.ndarray) -> np.ndarray:
        """Chạy inference qua GFPGAN ONNX"""
        if self.gfpgan_session is None:
            return face_bgr

        # Chuyển BGR sang RGB
        face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
        
        # Chuẩn hóa về [-1, 1] và định dạng tensor (1, 3, 512, 512)
        norm_img = (face_rgb.astype(np.float32) / 127.5) - 1.0
        norm_img = np.transpose(norm_img, (2, 0, 1))
        norm_img = np.expand_dims(norm_img, axis=0)

        # Run ONNX
        input_name = self.gfpgan_session.get_inputs()[0].name
        outputs = self.gfpgan_session.run(None, {input_name: norm_img})
        
        # Đưa tensor đầu ra về ảnh BGR [0, 255]
        out_tensor = outputs[0][0]
        out_img = np.transpose(out_tensor, (1, 2, 0))
        out_img = np.clip((out_img + 1.0) * 127.5, 0, 255).astype(np.uint8)
        
        out_bgr = cv2.cvtColor(out_img, cv2.COLOR_RGB2BGR)
        return out_bgr

    def enhance_image(
        self,
        img_bgr: np.ndarray,
        face_strength: float = 0.85
    ) -> Tuple[np.ndarray, int]:
        """
        Thực hiện toàn bộ pipeline 2 giai đoạn:
        1. Tìm khuôn mặt
        2. Căn chỉnh & Phục hồi qua GFPGAN
        3. Ghép mượt mà (Seamless Inverse Affine Blending) trở lại ảnh gốc
        """
        faces = self.detect_faces(img_bgr)
        if len(faces) == 0:
            return img_bgr, 0

        h, w = img_bgr.shape[:2]
        result_img = img_bgr.copy().astype(np.float32)
        feather_mask = self._generate_feather_mask()

        for face in faces:
            landmarks = face["landmarks"]
            aligned_face, affine_mat = self._align_crop(img_bgr, landmarks)
            
            # Chạy GFPGAN
            restored_face = self.restore_face_crop(aligned_face)

            # Hòa trộn theo độ nét mong muốn (Fidelity / Strength)
            if face_strength < 1.0:
                restored_face = cv2.addWeighted(
                    restored_face, face_strength, aligned_face, 1.0 - face_strength, 0
                )

            # Nghịch đảo ma trận Affine để đưa khuôn mặt 512x512 về đúng tọa độ ảnh gốc
            inv_affine = cv2.invertAffineTransform(affine_mat)

            # Biến đổi mặt và mask về kích thước ảnh gốc
            restored_warped = cv2.warpAffine(
                restored_face, inv_affine, (w, h), flags=cv2.INTER_LINEAR
            ).astype(np.float32)
            
            mask_warped = cv2.warpAffine(
                feather_mask, inv_affine, (w, h), flags=cv2.INTER_LINEAR
            )
            mask_3d = np.repeat(mask_warped[:, :, np.newaxis], 3, axis=2)

            # Hòa trộn mặt nạ mượt mà (Feather Blending)
            result_img = restored_warped * mask_3d + result_img * (1.0 - mask_3d)

        final_bgr = np.clip(result_img, 0, 255).astype(np.uint8)
        return final_bgr, len(faces)
