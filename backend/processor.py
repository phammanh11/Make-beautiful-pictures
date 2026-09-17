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
        output_format: str = "png"
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        if not input_path.exists():
            raise FileNotFoundError(f"Input file not found: {input_path}")
            
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
        final_filename = f"upscaled_{job_id}.{output_format.lower()}"
        final_output_path = OUTPUTS_DIR / final_filename

        # Determine AI scale
        ai_scale = 4
        if "animevideov3" in model_name:
            model_key = "realesr-animevideov3"
            ai_scale = 4
        else:
            model_key = model_name

        input_abs = input_path.resolve()
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
        
        # Execute Real-ESRGAN
        try:
            res = subprocess.run(
                cmd,
                cwd=str(self.engine_path.parent),
                capture_output=True,
                text=True,
                check=True
            )
        except subprocess.CalledProcessError as e:
            print(f"[AI Upscaler] GPU run error ({e.stderr}). Falling back to CPU mode...")
            cmd[-1] = "-1"
            res = subprocess.run(
                cmd,
                cwd=str(self.engine_path.parent),
                capture_output=True,
                text=True,
                check=True
            )

        if not raw_ai_output.exists():
            raise RuntimeError("Real-ESRGAN failed to produce output image.")

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

            # Deep Face Restoration (GFPGAN + YuNet)
            if enhance_face and "anime" not in model_name and self.face_restorer.is_ready:
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
                final_img = final_img.filter(
                    ImageFilter.UnsharpMask(radius=1.2, percent=int(sharpen_percent), threshold=2)
                )
                if "anime" not in model_name and detail_blend > 0:
                    detail_img = final_img.filter(ImageFilter.DETAIL)
                    final_img = Image.blend(final_img, detail_img, min(1.0, max(0.0, float(detail_blend))))

            # Export in desired format
            out_fmt = output_format.upper()
            if out_fmt in ("JPG", "JPEG"):
                if final_img.mode in ("RGBA", "P"):
                    final_img = final_img.convert("RGB")
                final_img.save(final_output_path, format="JPEG", quality=98, subsampling=0)
            elif out_fmt == "WEBP":
                final_img.save(final_output_path, format="WEBP", quality=95, method=6)
            else:
                final_img.save(final_output_path, format="PNG", compress_level=3)

        # Cleanup raw AI temp file
        if raw_ai_output.exists():
            try:
                os.remove(raw_ai_output)
            except Exception:
                pass

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
            "pro_settings": {
                "sharpen_percent": sharpen_percent,
                "detail_blend": detail_blend,
                "enhance_face": enhance_face,
                "face_strength": face_strength,
                "tile_size": tile_size
            },
            "download_url": f"/outputs/{final_filename}",
            "original_url": f"/uploads/{input_path.name}"
        }
