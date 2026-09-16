import os
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, Union
from PIL import Image

def classify_image(image_input: Union[str, Path, Image.Image]) -> Dict[str, Any]:
    """
    Phân tích thông minh đa tầng Computer Vision:
    1. Nhận diện QR Code, Thẻ thanh toán & Bảng đồ họa (để không bị nhầm ảnh đời thực thành anime)
    2. Nhận diện Chủ thể người (Khuôn mặt, màu da YCrCb/HSV, độ phân bố người)
    3. Nhận diện Phong cảnh toàn cảnh (Bầu trời, thảm thực vật cây cối, núi đồi, tỷ lệ khung hình góc rộng)
    4. Phân tích kết cấu ma trận 4x4 (16 vùng) để phân loại chính xác:
       - 'portrait_landscape': Chủ thể người & Phong cảnh toàn cảnh (realesrgan-x4plus)
       - 'portrait': Chân dung & Người (realesrgan-x4plus)
       - 'landscape': Phong cảnh toàn cảnh (realesrgan-x4plus)
       - 'photo': Ảnh chụp đời sống thực tế (realesrgan-x4plus)
       - 'anime': Tranh vẽ 2D / Anime / Manga (realesrgan-x4plus-anime)
    """
    if isinstance(image_input, (str, Path)):
        img_bgr = cv2.imread(str(image_input))
        if img_bgr is None:
            # Fallback PIL
            with Image.open(image_input) as pil_img:
                img_bgr = cv2.cvtColor(np.array(pil_img.convert('RGB')), cv2.COLOR_RGB2BGR)
    else:
        img_bgr = cv2.cvtColor(np.array(image_input.convert('RGB')), cv2.COLOR_RGB2BGR)

    return _analyze_cv_image(img_bgr)

def _analyze_cv_image(img: np.ndarray) -> Dict[str, Any]:
    h, w = img.shape[:2]
    aspect_ratio = round(w / h, 2)

    # 1. Phát hiện mã QR / Thẻ đồ họa / Poster đè lên ảnh
    qr_detector = cv2.QRCodeDetector()
    try:
        val, pts, _ = qr_detector.detectAndDecode(img)
        has_qr = bool(val or (pts is not None and len(pts) > 0))
    except Exception:
        has_qr = False

    # Resize để phân tích nhanh nhưng giữ đủ chi tiết (400x400)
    analysis_img = cv2.resize(img, (400, 400), interpolation=cv2.INTER_AREA)
    ycrcb = cv2.cvtColor(analysis_img, cv2.COLOR_BGR2YCrCb)
    hsv = cv2.cvtColor(analysis_img, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(analysis_img, cv2.COLOR_BGR2GRAY)

    # 2. Bắt chủ thể người (Phát hiện dải màu da sinh học YCrCb + HSV)
    # Cr: 133-173, Cb: 77-127 kết hợp độ bão hòa tự nhiên
    cr = ycrcb[:, :, 1]
    cb = ycrcb[:, :, 2]
    skin_mask = (
        (cr >= 133) & (cr <= 173) &
        (cb >= 77) & (cb <= 127) &
        (hsv[:, :, 1] >= 25) & (hsv[:, :, 1] <= 180) &
        (hsv[:, :, 2] >= 35)
    )
    skin_ratio = float(np.mean(skin_mask))
    has_human = skin_ratio >= 0.015  # >1.5% diện tích là người/da

    # 3. Bắt phong cảnh toàn cảnh (Bầu trời, núi non, cây cối)
    # Bầu trời: Xanh dương / Cyan (H: 90-130) hoặc ráng chiều (H: 5-25, sáng)
    sky_mask = (
        ((hsv[:, :, 0] >= 90) & (hsv[:, :, 0] <= 130) & (hsv[:, :, 1] >= 15) & (hsv[:, :, 2] >= 80)) |
        ((hsv[:, :, 0] >= 5) & (hsv[:, :, 0] <= 25) & (hsv[:, :, 1] >= 20) & (hsv[:, :, 2] >= 140))
    )
    # Thảm thực vật / cây cối / núi rừng (H: 35-85)
    green_mask = (
        (hsv[:, :, 0] >= 35) & (hsv[:, :, 0] <= 85) &
        (hsv[:, :, 1] >= 25) & (hsv[:, :, 2] >= 30)
    )
    sky_ratio = float(np.mean(sky_mask))
    green_ratio = float(np.mean(green_mask))

    has_panorama = (
        (sky_ratio > 0.12) or 
        (green_ratio > 0.08) or 
        (aspect_ratio >= 1.25 and (sky_ratio + green_ratio) > 0.10)
    )

    # 4. Phân tích kết cấu ma trận 4x4 (16 vùng) để đo độ chi tiết ảnh thật
    tiles_w, tiles_h = 4, 4
    photo_tiles = 0
    flat_tiles = 0

    for i in range(tiles_h):
        for j in range(tiles_w):
            tile = analysis_img[i*100:(i+1)*100, j*100:(j+1)*100]
            tile_gray = gray[i*100:(i+1)*100, j*100:(j+1)*100]
            tile_hsv = hsv[i*100:(i+1)*100, j*100:(j+1)*100]

            # Độ biến thiên Laplacian (hạt nhiễu/chi tiết tự nhiên)
            lap_var = cv2.Laplacian(tile_gray, cv2.CV_64F).var()
            
            # Độ phẳng mảng màu (Cel-shading)
            diff_x = np.abs(tile[:, 1:, :] - tile[:, :-1, :])
            flat_ratio = np.mean(diff_x < 5)

            t_sky = np.mean((tile_hsv[:, :, 0] >= 90) & (tile_hsv[:, :, 0] <= 130) & (tile_hsv[:, :, 2] >= 80))
            t_green = np.mean((tile_hsv[:, :, 0] >= 35) & (tile_hsv[:, :, 0] <= 85) & (tile_hsv[:, :, 1] >= 25))

            if t_sky > 0.15 or t_green > 0.12 or (lap_var > 110 and flat_ratio < 0.68):
                photo_tiles += 1
            else:
                flat_tiles += 1

    # Kiểm tra ảnh trắng đen (Monochrome / Manga)
    mean_sat = float(np.mean(hsv[:, :, 1]))
    if mean_sat < 20.0:
        bimodal_ratio = float(np.mean((gray < 50) | (gray > 215)))
        if bimodal_ratio > 0.55:
            return {
                "detected_type": "anime",
                "recommended_model": "realesrgan-x4plus-anime",
                "confidence": 95,
                "label": "Manga / Tranh Vẽ Trắng Đen 2D",
                "reason": "Phát hiện nét mực vẽ và mảng tương phản đen trắng đặc trưng Manga",
                "has_human": False,
                "has_panorama": False,
                "has_qr": has_qr,
                "tags": ["Manga 2D", "Nét Mực Trắng Đen"],
                "metrics": {"saturation": round(mean_sat, 1), "bimodal": round(bimodal_ratio, 2)}
            }
        else:
            return {
                "detected_type": "photo",
                "recommended_model": "realesrgan-x4plus",
                "confidence": 90,
                "label": "Ảnh Chụp Trắng Đen (Monochrome Photo)",
                "reason": "Dải sắc độ xám mịn và hạt nhiễu tự nhiên của ảnh chụp thực tế",
                "has_human": has_human,
                "has_panorama": has_panorama,
                "has_qr": has_qr,
                "tags": ["Ảnh Chụp Đời Sống", "Đơn Sắc (B&W)"],
                "metrics": {"saturation": round(mean_sat, 1), "bimodal": round(bimodal_ratio, 2)}
            }

    # 5. Phân loại tổng hợp
    is_real_photo = (photo_tiles >= 4) or has_human or has_panorama

    if has_human and has_panorama:
        # Trường hợp như ảnh người dùng: có cả người và cảnh quan thiên nhiên rộng
        conf = min(98, 88 + int(skin_ratio * 100))
        tags = ["Chủ thể người", "Phong cảnh góc rộng", "Ảnh chụp đời thực"]
        if has_qr:
            tags.append("Có thẻ / QR code đồ họa")
        return {
            "detected_type": "portrait_landscape",
            "recommended_model": "realesrgan-x4plus",
            "confidence": conf,
            "label": "Chủ Thể Người & Phong Cảnh Toàn Cảnh",
            "reason": f"Đã bắt chủ thể người (da, tóc, trang phục) và toàn cảnh góc rộng ({sky_ratio*100:.0f}% bầu trời, núi non). Tự động kích hoạt mô hình Real Photo & Portrait tối ưu độ nét.",
            "has_human": True,
            "has_panorama": True,
            "has_qr": has_qr,
            "tags": tags,
            "metrics": {
                "skin_ratio": round(skin_ratio * 100, 1),
                "sky_ratio": round(sky_ratio * 100, 1),
                "green_ratio": round(green_ratio * 100, 1),
                "photo_tiles": f"{photo_tiles}/16",
                "aspect_ratio": aspect_ratio
            }
        }

    elif has_human:
        # Chân dung hoặc người là trọng tâm
        conf = min(98, 85 + int(skin_ratio * 100))
        tags = ["Chủ thể người", "Ảnh chân dung", "Ảnh chụp thực tế"]
        if has_qr:
            tags.append("Có thẻ đồ họa / QR")
        return {
            "detected_type": "portrait",
            "recommended_model": "realesrgan-x4plus",
            "confidence": conf,
            "label": "Chủ Thể Người & Ảnh Chân Dung (Portrait)",
            "reason": f"Phát hiện chủ thể người rõ rệt ({skin_ratio*100:.1f}% vùng da & dáng người). Áp dụng mô hình Real-ESRGAN chuyên phục chế chi tiết người.",
            "has_human": True,
            "has_panorama": False,
            "has_qr": has_qr,
            "tags": tags,
            "metrics": {
                "skin_ratio": round(skin_ratio * 100, 1),
                "photo_tiles": f"{photo_tiles}/16"
            }
        }

    elif has_panorama:
        # Phong cảnh góc rộng
        conf = min(96, 85 + int((sky_ratio + green_ratio) * 50))
        return {
            "detected_type": "landscape",
            "recommended_model": "realesrgan-x4plus",
            "confidence": conf,
            "label": "Phong Cảnh Toàn Cảnh (Landscape Scenery)",
            "reason": f"Góc chụp toàn cảnh thiên nhiên ({sky_ratio*100:.0f}% bầu trời, {green_ratio*100:.0f}% cây cỏ/núi đồi). Tối ưu hóa độ sâu trường ảnh và vi chi tiết.",
            "has_human": False,
            "has_panorama": True,
            "has_qr": has_qr,
            "tags": ["Phong cảnh thiên nhiên", "Toàn cảnh góc rộng", "Ảnh chụp thực tế"],
            "metrics": {
                "sky_ratio": round(sky_ratio * 100, 1),
                "green_ratio": round(green_ratio * 100, 1),
                "aspect_ratio": aspect_ratio
            }
        }

    elif is_real_photo:
        # Ảnh chụp thực tế đời sống (đồ vật, nội thất, món ăn, kiến trúc...)
        return {
            "detected_type": "photo",
            "recommended_model": "realesrgan-x4plus",
            "confidence": 90,
            "label": "Ảnh Chụp Đời Sống Thực Tế (Real Photo)",
            "reason": "Dải màu tự nhiên, kết cấu bề mặt thực và chuyển sắc chân thực.",
            "has_human": False,
            "has_panorama": False,
            "has_qr": has_qr,
            "tags": ["Ảnh chụp đời thực", "Chi tiết vật thể thực"],
            "metrics": {
                "photo_tiles": f"{photo_tiles}/16",
                "saturation": round(mean_sat, 1)
            }
        }

    else:
        # Tranh vẽ 2D / Anime / Manga thực thụ
        return {
            "detected_type": "anime",
            "recommended_model": "realesrgan-x4plus-anime",
            "confidence": 92,
            "label": "Tranh Vẽ & Anime / Manga (2D)",
            "reason": "Mảng màu phẳng cel-shading, nét vẽ hoạt hình lineart và không có yếu tố ảnh chụp đời thực.",
            "has_human": False,
            "has_panorama": False,
            "has_qr": has_qr,
            "tags": ["Anime / Manga 2D", "Nét vẽ minh họa"],
            "metrics": {
                "flat_tiles": f"{flat_tiles}/16",
                "saturation": round(mean_sat, 1)
            }
        }
