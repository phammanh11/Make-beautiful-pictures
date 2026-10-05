import os
import re
import time
import uuid
import shutil
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, Callable
import cv2

try:
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_EXE = "ffmpeg"

from config import (
    BASE_DIR,
    ENGINE_EXE,
    MODELS_DIR,
    OUTPUTS_DIR,
    UPLOADS_DIR
)

class VideoUpscaleProcessor:
    def __init__(self):
        self.engine_exe = ENGINE_EXE
        self.models_dir = MODELS_DIR
        self.ffmpeg_exe = FFMPEG_EXE

    def get_video_info(self, video_path: Path) -> Dict[str, Any]:
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise RuntimeError(f"Không thể mở file video: {video_path}")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = round(float(cap.get(cv2.CAP_PROP_FPS)), 2) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = round(total_frames / fps, 2) if fps > 0 else 0.0
        file_size = video_path.stat().st_size
        cap.release()

        return {
            "width": width,
            "height": height,
            "fps": fps,
            "total_frames": total_frames,
            "duration_seconds": duration,
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

    def process_video(
        self,
        input_video_path: Path,
        scale: int = 2,
        model_name: str = "realesr-animevideov3",
        tile_size: int = 200,
        gpu_id: int = 0,
        progress_callback: Optional[Callable[[float, str, str], None]] = None,
        on_proc_started: Optional[Any] = None,
        cancel_checker: Optional[Any] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        job_id = uuid.uuid4().hex[:8]
        temp_dir = OUTPUTS_DIR / f"temp_video_{job_id}"
        frames_in_dir = temp_dir / "in_frames"
        frames_out_dir = temp_dir / "out_frames"
        audio_file = temp_dir / "audio.aac"

        temp_dir.mkdir(parents=True, exist_ok=True)
        frames_in_dir.mkdir(parents=True, exist_ok=True)
        frames_out_dir.mkdir(parents=True, exist_ok=True)

        final_filename = f"upscaled_video_{job_id}.mp4"
        final_video_path = OUTPUTS_DIR / final_filename

        try:
            if cancel_checker and cancel_checker():
                raise RuntimeError("Tác vụ đã được hủy bởi người dùng.")

            if progress_callback:
                progress_callback(3.0, "init", "Đang phân tích thông số video...")

            orig_info = self.get_video_info(input_video_path)
            fps = orig_info["fps"]
            total_frames = orig_info["total_frames"]

            # 1. Trích xuất âm thanh (nếu có)
            if progress_callback:
                progress_callback(8.0, "extract", "Đang trích xuất audio gốc...")
            cmd_audio = [
                self.ffmpeg_exe, "-y",
                "-i", str(input_video_path.resolve()),
                "-vn", "-c:a", "aac",
                str(audio_file.resolve())
            ]
            has_audio = False
            try:
                res_audio = subprocess.run(cmd_audio, capture_output=True, text=True)
                if audio_file.exists() and audio_file.stat().st_size > 1000:
                    has_audio = True
            except Exception:
                has_audio = False

            if cancel_checker and cancel_checker():
                raise RuntimeError("Tác vụ đã được hủy bởi người dùng.")

            # 2. Tách frames từ video
            if progress_callback:
                progress_callback(12.0, "extract", f"Đang tách {total_frames} khung hình video...")

            cmd_extract = [
                self.ffmpeg_exe, "-y",
                "-i", str(input_video_path.resolve()),
                "-qscale:v", "2",
                str((frames_in_dir / "frame_%06d.jpg").resolve())
            ]
            subprocess.run(cmd_extract, capture_output=True, check=True)

            extracted_count = len(list(frames_in_dir.glob("*.jpg")))
            if extracted_count == 0:
                raise RuntimeError("Không thể trích xuất khung hình từ video.")

            if cancel_checker and cancel_checker():
                raise RuntimeError("Tác vụ đã được hủy bởi người dùng.")

            # 3. Siêu phân giải hàng loạt frame bằng Real-ESRGAN Vulkan NCNN (Dùng JPG tối ưu I/O)
            if progress_callback:
                progress_callback(20.0, "ai_video", f"Đang siêu phân giải AI ({model_name} {scale}X) qua GPU Intel Iris Xe...")

            cmd_ai = [
                str(self.engine_exe.resolve()),
                "-i", str(frames_in_dir.resolve()),
                "-o", str(frames_out_dir.resolve()),
                "-m", str(self.models_dir.resolve()),
                "-n", model_name,
                "-s", str(scale),
                "-t", str(tile_size if tile_size > 0 else 200),
                "-g", str(gpu_id),
                "-j", "1:2:2",
                "-f", "jpg"
            ]

            proc = subprocess.Popen(
                cmd_ai,
                cwd=str(self.engine_exe.parent),
                stderr=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            if on_proc_started:
                on_proc_started(proc)

            pct_regex = re.compile(r"(\d+(\.\d+)?)%")
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
                    overall = round(20.0 + (gpu_pct * 0.65), 1)
                    if progress_callback:
                        progress_callback(
                            overall,
                            "ai_video",
                            f"Đang siêu phân giải frames AI GPU: {gpu_pct:.1f}% ({extracted_count} frames)"
                        )
            proc.wait()
            if proc.returncode != 0:
                raise RuntimeError(f"Vulkan NCNN engine exited with code {proc.returncode}")

            if cancel_checker and cancel_checker():
                raise RuntimeError("Tác vụ đã được hủy bởi người dùng.")

            # 4. Ghép lại khung hình thành Video MP4 chất lượng cao
            if progress_callback:
                progress_callback(88.0, "encode", "Đang mã hóa & ghép video chuẩn H.264 High Profile...")

            target_w = orig_info["width"] * scale
            target_h = orig_info["height"] * scale

            cmd_mux = [
                self.ffmpeg_exe, "-y",
                "-framerate", str(fps),
                "-i", str((frames_out_dir / "frame_%06d.jpg").resolve())
            ]

            if has_audio:
                cmd_mux.extend([
                    "-i", str(audio_file.resolve()),
                    "-c:a", "copy"
                ])

            cmd_mux.extend([
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-crf", "18",
                "-preset", "fast",
                str(final_video_path.resolve())
            ])

            subprocess.run(cmd_mux, capture_output=True, check=True)

            if not final_video_path.exists():
                raise RuntimeError("Lỗi khi ghép video đầu ra.")

            if progress_callback:
                progress_callback(100.0, "done", "Hoàn tất siêu phân giải video!")

            elapsed = round(time.time() - start_time, 2)
            out_info = self.get_video_info(final_video_path)

            return {
                "job_id": job_id,
                "filename": final_filename,
                "input": orig_info,
                "output": out_info,
                "scale": scale,
                "model_used": model_name,
                "elapsed_seconds": elapsed,
                "frames_processed": extracted_count,
                "download_url": f"/outputs/{final_filename}",
                "original_url": f"/uploads/{input_video_path.name}"
            }

        finally:
            # Thu dọn temp frames
            if temp_dir.exists():
                try:
                    shutil.rmtree(temp_dir)
                except Exception:
                    pass
