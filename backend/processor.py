import os
import sys
import time
import uuid
import shutil
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from PIL import Image, ImageFilter, ImageOps
import cv2
import numpy as np

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass

from config import (
    ENGINE_EXE,
    MODELS_DIR,
    UPLOADS_DIR,
    OUTPUTS_DIR,
    MODELS,
    RESOLUTION_PRESETS
)
from face_enhancer import FaceRestorer

class UpscaleProcessor:
    def __init__(self):
        self.engine_path = ENGINE_EXE
        self.models_dir = MODELS_DIR
        self.face_restorer = FaceRestorer(MODELS_DIR)

    def get_image_info(self, file_path: Path) -> Dict[str, Any]:
        with Image.open(file_path) as img:
            width, height = img.size
            format_name = img.format or "PNG"
            mode = img.mode
        
        file_size = os.path.getsize(file_path)
        megapixels = round((width * height) / 1_000_000, 2)
        aspect_ratio = round(width / height, 3)
        
        return {
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio,
            "megapixels": megapixels,
            "format": format_name,
            "mode": mode,
            "size_bytes": file_size,
            "size_human": self._format_size(file_size)
        }

    def _format_size(self, size_bytes: int) -> str:
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.2f} MB"

    def calculate_target_dimensions(
        self, orig_w: int, orig_h: int, preset: str, custom_scale: Optional[float] = None
    ) -> Tuple[int, int, float]:
        aspect = orig_w / orig_h
        
        if preset in ["2x", "4x"]:
            factor = 2.0 if preset == "2x" else 4.0
            target_w = int(round(orig_w * factor))
            target_h = int(round(orig_h * factor))
            return target_w, target_h, factor
        
        if preset == "1080p":
            if orig_w >= orig_h:
                target_w = 1920
                target_h = int(round(1920 / aspect))
            else:
                target_h = 1920
                target_w = int(round(1920 * aspect))
            factor = round(target_w / orig_w, 2)
            return target_w, target_h, factor
        
        elif preset == "2k":
            if orig_w >= orig_h:
                target_w = 2560
                target_h = int(round(2560 / aspect))
            else:
                target_h = 2560
                target_w = int(round(2560 * aspect))
            factor = round(target_w / orig_w, 2)
            return target_w, target_h, factor
        
        elif preset == "4k":
            if orig_w >= orig_h:
                target_w = 3840
                target_h = int(round(3840 / aspect))
            else:
                target_h = 3840
                target_w = int(round(3840 * aspect))
            factor = round(target_w / orig_w, 2)
            return target_w, target_h, factor
            
        elif preset == "8k":
            if orig_w >= orig_h:
                target_w = 7680
                target_h = int(round(7680 / aspect))
            else:
                target_h = 7680
                target_w = int(round(7680 * aspect))
            factor = round(target_w / orig_w, 2)
            return target_w, target_h, factor
            
        elif custom_scale and custom_scale > 0:
            target_w = int(round(orig_w * custom_scale))
            target_h = int(round(orig_h * custom_scale))
            return target_w, target_h, custom_scale

        # Default: 4x scale
        return orig_w * 4, orig_h * 4, 4.0

    def process(
        self,
        input_path: Path,
        model_name: str = "realesrgan-x4plus",
        preset: str = "1080p",
        custom_scale: Optional[float] = None,
        tile_size: int = 100,
        gpu_id: int = 0,
        enhance_sharpness: bool = True,
        sharpen_percent: int = 120,
        detail_blend: float = 0.40,
        enhance_face: bool = True,
        face_strength: float = 0.85,
        enable_clahe: bool = False,
        enable_denoise: bool = False,
        output_format: str = "png",
        progress_callback: Optional[Any] = None,
        on_proc_started: Optional[Any] = None,
        cancel_checker: Optional[Any] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        if not input_path.exists():
            raise FileNotFoundError(f"Input file not found: {input_path}")

        if progress_callback:
            progress_callback(5.0, "init", "Đang nạp ảnh và khởi tạo mô hình Vulkan NCNN...")
            
        # Ensure safe tile size
        if tile_size <= 0:
            tile_size = 100
        elif tile_size > 500:
            tile_size = 400
        
        orig_info = self.get_image_info(input_path)
        orig_w, orig_h = orig_info["width"], orig_info["height"]
        
        target_w, target_h, effective_scale = self.calculate_target_dimensions(
            orig_w, orig_h, preset, custom_scale
        )
        
        job_id = str(uuid.uuid4())[:8]
        raw_ai_output = OUTPUTS_DIR / f"raw_ai_{job_id}.png"
        out_ext = output_format.lower()
        if out_ext == "jpeg":
            out_ext = "jpg"
        final_filename = f"upscaled_{job_id}.{out_ext}"
        final_output_path = OUTPUTS_DIR / final_filename

        # Tự động chuyển đổi định dạng đầu vào nếu không phải JPG/PNG/WEBP (ví dụ HEIC, AVIF, BMP, TIFF)
        engine_input_path = input_path
        temp_converted_input = None
        if input_path.suffix.lower() in ('.heic', '.heif', '.avif', '.bmp', '.tiff', '.tif'):
            temp_converted_input = UPLOADS_DIR / f"temp_conv_{job_id}.png"
            with Image.open(input_path) as src_im:
                src_im = ImageOps.exif_transpose(src_im) or src_im
                src_im.convert("RGB").save(temp_converted_input, format="PNG")
            engine_input_path = temp_converted_input

        # Đọc EXIF gốc để bảo tồn
        orig_exif = None
        try:
            with Image.open(input_path) as raw_input_img:
                orig_exif = raw_input_img.getexif()
        except Exception:
            orig_exif = None

        # Determine AI scale
        ai_scale = 4
        if "animevideov3" in model_name:
            model_key = "realesr-animevideov3"
            if preset == "2x" or (custom_scale and abs(custom_scale - 2.0) < 0.1):
                ai_scale = 2
            elif preset == "3x" or (custom_scale and abs(custom_scale - 3.0) < 0.1):
                ai_scale = 3
            else:
                ai_scale = 4
        else:
            model_key = model_name

        input_abs = engine_input_path.resolve()
        raw_ai_output_abs = raw_ai_output.resolve()
        models_dir_abs = self.models_dir.resolve()

        cmd = [
            str(self.engine_path.resolve()),
            "-i", str(input_abs),
            "-o", str(raw_ai_output_abs),
            "-m", str(models_dir_abs),
            "-n", model_key,
            "-s", str(ai_scale),
            "-t", str(tile_size),
            "-g", str(gpu_id)
        ]
        
        print(f"[AI Upscaler] Running command: {' '.join(cmd)}")
        if progress_callback:
            progress_callback(10.0, "ai_upscale", f"Đang khởi động Vulkan GPU với mô hình {model_key}...")
        
        # Execute Real-ESRGAN với real-time stderr progress tracking & cancellation check
        import re
        pct_regex = re.compile(r"(\d+(\.\d+)?)%")
        
        try:
            proc = subprocess.Popen(
                cmd,
                cwd=str(self.engine_path.parent),
                stderr=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            if on_proc_started:
                on_proc_started(proc)

            for line in iter(proc.stderr.readline, ''):
                if cancel_checker and cancel_checker():
                    proc.terminate()
                    proc.kill()
                    raise RuntimeError("Tác vụ đã được hủy bởi người dùng.")
                if not line:
                    break
                m = pct_regex.search(line)
                if m:
                    gpu_pct = float(m.group(1))
                    overall_pct = round(10.0 + (gpu_pct * 0.60), 1)
                    if progress_callback:
                        progress_callback(
                            overall_pct,
                            "ai_upscale",
                            f"Đang siêu phân giải AI GPU: {gpu_pct:.1f}% (Tile {tile_size}px)"
                        )
            proc.wait()
            if proc.returncode != 0:
                raise RuntimeError(f"Vulkan GPU run exited with code {proc.returncode}")
        except Exception as e:
            if cancel_checker and cancel_checker():
                raise RuntimeError("Tác vụ đã được hủy bởi người dùng.")
            print(f"[AI Upscaler] GPU run error ({e}). Falling back to CPU mode...")
            if progress_callback:
                progress_callback(15.0, "ai_upscale", "Chuyển sang chế độ CPU đa luồng dự phòng...")
            cmd[-1] = "-1"
            proc_cpu = subprocess.Popen(
                cmd,
                cwd=str(self.engine_path.parent),
                stderr=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                text=True,
                bufsize=1
            )
            if on_proc_started:
                on_proc_started(proc_cpu)

            for line in iter(proc_cpu.stderr.readline, ''):
                if cancel_checker and cancel_checker():
                    proc_cpu.terminate()
                    proc_cpu.kill()
                    raise RuntimeError("Tác vụ đã được hủy bởi người dùng.")
                if not line:
                    break
                m = pct_regex.search(line)
                if m:
                    cpu_pct = float(m.group(1))
                    overall_pct = round(10.0 + (cpu_pct * 0.60), 1)
                    if progress_callback:
                        progress_callback(
                            overall_pct,
                            "ai_upscale",
                            f"Đang siêu phân giải AI CPU đa luồng: {cpu_pct:.1f}%"
                        )
            proc_cpu.wait()

        if not raw_ai_output.exists():
            raise RuntimeError("Real-ESRGAN failed to produce output image.")

        if progress_callback:
            progress_callback(72.0, "resample", f"Đang tái tạo độ phân giải mục tiêu {target_w}×{target_h} (Lanczos-4)...")

        # Post-Processing: Resampling & Deep Face Restoration
        faces_restored_count = 0
        with Image.open(raw_ai_output) as ai_img:
            ai_img = ImageOps.exif_transpose(ai_img) or ai_img
            current_w, current_h = ai_img.size

            # Lanczos super-sampling to exact target dimensions
            if (current_w, current_h) != (target_w, target_h):
                final_img = ai_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
            else:
                final_img = ai_img.copy()

            # Optional Pre-filter: Denoise hoặc CLAHE
            if enable_denoise or enable_clahe:
                if progress_callback:
                    progress_callback(76.0, "enhancement", "Đang áp dụng bộ lọc khử nhiễu & tối ưu tương phản CLAHE...")
                np_img = np.array(final_img.convert("RGB"))
                bgr_img = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)

                if enable_denoise:
                    # Edge-preserving bilateral filter
                    bgr_img = cv2.bilateralFilter(bgr_img, d=7, sigmaColor=50, sigmaSpace=7)

                if enable_clahe:
                    # Contrast Limited Adaptive Histogram Equalization trên kênh L (Luminance)
                    lab = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2LAB)
                    l, a, b = cv2.split(lab)
                    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                    cl = clahe.apply(l)
                    merged_lab = cv2.merge((cl, a, b))
                    bgr_img = cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)

                final_img = Image.fromarray(cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB))

            # Deep Face Restoration (GFPGAN + YuNet)
            if enhance_face and "anime" not in model_name and self.face_restorer.is_ready:
                if progress_callback:
                    progress_callback(80.0, "face_restore", "Đang nhận diện và phục hồi chi tiết khuôn mặt qua GFPGAN DirectML...")
                try:
                    rgb_arr = np.array(final_img.convert("RGB"))
                    bgr_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
                    enhanced_bgr, faces_restored_count = self.face_restorer.enhance_image(
                        bgr_arr, face_strength=float(face_strength)
                    )
                    if faces_restored_count > 0:
                        print(f"[AI Upscaler] Successfully restored {faces_restored_count} face(s) via GFPGAN!")
                        enhanced_rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)
                        final_img = Image.fromarray(enhanced_rgb)
                except Exception as e:
                    print(f"[AI Upscaler] Face restoration warning: {e}")

            # Apply configurable sharpness enhancement
            if enhance_sharpness and sharpen_percent > 0:
                if progress_callback:
                    progress_callback(90.0, "post_process", f"Đang áp dụng Unsharp Masking ({sharpen_percent}%) & cấu trúc vi mô...")
                final_img = final_img.filter(
                    ImageFilter.UnsharpMask(radius=1.2, percent=int(sharpen_percent), threshold=2)
                )
                if "anime" not in model_name and detail_blend > 0:
                    detail_img = final_img.filter(ImageFilter.DETAIL)
                    final_img = Image.blend(final_img, detail_img, min(1.0, max(0.0, float(detail_blend))))

            if progress_callback:
                progress_callback(95.0, "save", f"Đang xuất file {out_ext.upper()} với chuẩn in ấn 300 DPI...")

            # Cấu hình lưu ảnh chuẩn in ấn 300 DPI và bảo tồn EXIF gốc
            save_kwargs: Dict[str, Any] = {"dpi": (300, 300)}
            if orig_exif:
                save_kwargs["exif"] = orig_exif

            # Export in desired format with EXIF error fallback
            out_fmt = output_format.upper()
            try:
                if out_fmt in ("JPG", "JPEG"):
                    if final_img.mode in ("RGBA", "P"):
                        final_img = final_img.convert("RGB")
                    final_img.save(final_output_path, format="JPEG", quality=98, subsampling=0, **save_kwargs)
                elif out_fmt == "WEBP":
                    webp_kwargs: Dict[str, Any] = {"quality": 95, "method": 6}
                    if orig_exif:
                        webp_kwargs["exif"] = orig_exif
                    final_img.save(final_output_path, format="WEBP", **webp_kwargs)
                elif out_fmt == "TIFF":
                    final_img.save(final_output_path, format="TIFF", compression="tiff_lzw", **save_kwargs)
                else:
                    final_img.save(final_output_path, format="PNG", compress_level=3, **save_kwargs)
            except Exception as save_err:
                print(f"[AI Upscaler] Warning saving with EXIF ({save_err}), retrying without EXIF...")
                fallback_kwargs: Dict[str, Any] = {"dpi": (300, 300)}
                if out_fmt in ("JPG", "JPEG"):
                    if final_img.mode in ("RGBA", "P"):
                        final_img = final_img.convert("RGB")
                    final_img.save(final_output_path, format="JPEG", quality=98, subsampling=0, **fallback_kwargs)
                elif out_fmt == "WEBP":
                    final_img.save(final_output_path, format="WEBP", quality=95, method=6)
                elif out_fmt == "TIFF":
                    final_img.save(final_output_path, format="TIFF", compression="tiff_lzw", **fallback_kwargs)
                else:
                    final_img.save(final_output_path, format="PNG", compress_level=3, **fallback_kwargs)

        # Cleanup raw AI temp file
        if raw_ai_output.exists():
            try:
                os.remove(raw_ai_output)
            except Exception:
                pass

        if progress_callback:
            progress_callback(100.0, "done", "Hoàn tất siêu phân giải ảnh!")

        elapsed = round(time.time() - start_time, 2)
        final_info = self.get_image_info(final_output_path)

        return {
            "job_id": job_id,
            "filename": final_filename,
            "input": orig_info,
            "output": final_info,
            "model_used": model_name,
            "preset_used": preset,
            "effective_scale": effective_scale,
            "elapsed_seconds": elapsed,
            "faces_restored": faces_restored_count,
            "dpi": 300,
            "pro_settings": {
                "sharpen_percent": sharpen_percent,
                "detail_blend": detail_blend,
                "enhance_face": enhance_face,
                "face_strength": face_strength,
                "tile_size": tile_size,
                "enable_clahe": enable_clahe,
                "enable_denoise": enable_denoise,
                "output_format": output_format
            },
            "download_url": f"/outputs/{final_filename}",
            "original_url": f"/uploads/{input_path.name}"
        }
