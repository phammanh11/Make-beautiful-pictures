import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
ENGINE_DIR = BASE_DIR / "engine"
ENGINE_EXE = ENGINE_DIR / "realesrgan-ncnn-vulkan.exe"
MODELS_DIR = ENGINE_DIR / "models"
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

# Available Models
MODELS = {
    "realesrgan-x4plus": {
        "name": "realesrgan-x4plus",
        "label": "Ảnh Đời Sống & Phong Cảnh (General Photo)",
        "description": "Mô hình chất lượng cao nhất cho ảnh đời sống, người, cảnh vật, thiên nhiên, kiến trúc.",
        "default_scale": 4,
        "type": "general"
    },
    "realesrgan-x4plus-anime": {
        "name": "realesrgan-x4plus-anime",
        "label": "Tranh Vẽ & Anime / Manga (2D Art)",
        "description": "Tối ưu hóa khử viền mờ răng cưa, giữ nét vẽ phẳng, màu sắc trong trẻo cho tranh vẽ và hoạt hình.",
        "default_scale": 4,
        "type": "anime"
    },
    "realesr-animevideov3-x4": {
        "name": "realesr-animevideov3",
        "label": "Anime Video v3 (Siêu Tốc Độ)",
        "description": "Mô hình siêu nhẹ, tốc độ xử lý nhanh gấp nhiều lần, phù hợp cho frame video và anime.",
        "default_scale": 4,
        "type": "anime-fast"
    }
}

# Target Resolution Presets
RESOLUTION_PRESETS = {
    "1080p": {
        "label": "Full HD 1080p (1920 × 1080)",
        "width": 1920,
        "height": 1080,
        "description": "Chuẩn Full HD, tuyệt vời cho nâng từ 480p, 720p"
    },
    "2k": {
        "label": "2K QHD (2560 × 1440)",
        "width": 2560,
        "height": 1440,
        "description": "Chuẩn màn hình máy tính 2K sắc nét"
    },
    "4k": {
        "label": "4K Ultra HD (3840 × 2160)",
        "width": 3840,
        "height": 2160,
        "description": "Chuẩn 4K siêu nét, phóng to không vỡ hạt"
    },
    "8k": {
        "label": "8K Extreme UHD (7680 × 4320)",
        "width": 7680,
        "height": 4320,
        "description": "Độ phân giải cực đại cho in ấn và màn hình cỡ lớn"
    },
    "2x": {
        "label": "Scale 2X Gốc",
        "scale": 2,
        "description": "Nhân đôi chiều dài và chiều rộng so với ảnh gốc"
    },
    "4x": {
        "label": "Scale 4X Gốc (Khuyên dùng)",
        "scale": 4,
        "description": "Nhân 4 lần kích thước gốc, chi tiết AI tối đa"
    }
}
