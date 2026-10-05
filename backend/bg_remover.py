import io
from pathlib import Path
from typing import Union, Optional, Tuple, Dict, Any
from PIL import Image, ImageFilter, ImageColor
import numpy as np

try:
    import rembg
    HAS_REMBG = True
except ImportError:
    HAS_REMBG = False

_REMBG_SESSION = None

def get_rembg_session():
    global _REMBG_SESSION
    if _REMBG_SESSION is None and HAS_REMBG:
        try:
            _REMBG_SESSION = rembg.new_session("u2netp")
        except Exception as e:
            print(f"[Rembg] Fallback to default session: {e}")
            try:
                _REMBG_SESSION = rembg.new_session()
            except Exception:
                _REMBG_SESSION = None
    return _REMBG_SESSION

def remove_background(
    image_input: Union[Path, str, Image.Image],
    bg_mode: str = "transparent",  # "transparent", "white", "color", "blur"
    bg_color: str = "#ffffff",
    blur_radius: int = 15,
    feather_radius: int = 1
) -> Image.Image:
    """
    Tách nền ảnh thông minh bằng AI (rembg)
    Hỗ trợ:
    - Trong suốt (Transparent PNG)
    - Nền trắng chuẩn sàn TMĐT E-commerce (Shopee, Lazada, TikTok Shop)
    - Nền màu tùy chọn (Custom Hex Color)
    - Nền mờ nghệ thuật (Bokeh Background Blur)
    """
    if not HAS_REMBG:
        raise RuntimeError("Thư viện rembg chưa được cài đặt.")

    if isinstance(image_input, (str, Path)):
        orig_img = Image.open(image_input).convert("RGBA")
    else:
        orig_img = image_input.convert("RGBA")

    # 1. Chạy AI tách nền với session u2netp tối ưu
    sess = get_rembg_session()
    if sess is not None:
        no_bg_rgba = rembg.remove(orig_img, session=sess)
    else:
        no_bg_rgba = rembg.remove(orig_img)

    if feather_radius > 0:
        # Làm mịn nhẹ viền alpha
        r, g, b, a = no_bg_rgba.split()
        a = a.filter(ImageFilter.GaussianBlur(radius=feather_radius))
        no_bg_rgba.putalpha(a)

    if bg_mode == "transparent":
        return no_bg_rgba

    elif bg_mode == "white":
        canvas = Image.new("RGBA", orig_img.size, (255, 255, 255, 255))
        canvas.paste(no_bg_rgba, (0, 0), no_bg_rgba)
        return canvas.convert("RGB")

    elif bg_mode == "color":
        try:
            rgb = ImageColor.getrgb(bg_color)
            canvas = Image.new("RGBA", orig_img.size, (*rgb, 255))
        except Exception:
            canvas = Image.new("RGBA", orig_img.size, (255, 255, 255, 255))
        canvas.paste(no_bg_rgba, (0, 0), no_bg_rgba)
        return canvas.convert("RGB")

    elif bg_mode == "blur":
        # Làm mờ ảnh gốc làm hậu cảnh
        blurred_bg = orig_img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
        blurred_bg.paste(no_bg_rgba, (0, 0), no_bg_rgba)
        return blurred_bg.convert("RGB")

    return no_bg_rgba
