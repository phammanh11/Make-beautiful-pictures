import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import (
    UPLOADS_DIR,
    OUTPUTS_DIR,
    MODELS,
    RESOLUTION_PRESETS
)
from processor import UpscaleProcessor

app = FastAPI(
    title="AI Image Super-Resolution API",
    description="High Performance AI Super-Resolution (720p to 1080p, 2K, 4K) powered by Real-ESRGAN & Vulkan",
    version="1.0.0"
)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for viewing & downloading images
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")
app.mount("/engine-static", StaticFiles(directory=str(Path(__file__).parent / "engine")), name="engine")

# Mount frontend dist if built
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/")
    def serve_frontend_root():
        from fastapi.responses import FileResponse
        return FileResponse(FRONTEND_DIST / "index.html")

@app.get("/api/samples")
def get_samples():
    return {
        "samples": [
            {"id": "photo", "name": "Ảnh Mẫu Chân Dung & Đời Sống", "url": "/engine-static/input.jpg"},
            {"id": "anime", "name": "Ảnh Mẫu Anime & Tranh Vẽ 2D", "url": "/engine-static/input2.jpg"}
        ]
    }

from processor import UpscaleProcessor
from classifier import classify_image

processor = UpscaleProcessor()

# In-memory history tracking
HISTORY = []

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "AI Super-Resolution Engine is ready"}

@app.get("/api/system-info")
def get_system_info():
    return {
        "device": {
            "gpu": "Intel(R) Iris(R) Xe Graphics (Vulkan Acceleration Active)",
            "cpu": "13th Gen Intel(R) Core(TM) i5-13500H (16 Threads)",
            "vulkan_supported": True,
            "engine": "Real-ESRGAN NCNN Vulkan + Lanczos-4 SuperSampling"
        },
        "models": MODELS,
        "presets": RESOLUTION_PRESETS
    }

@app.post("/api/detect-model")
async def detect_model_endpoint(file: UploadFile = File(...)):
    """
    Quét và tự động phân tích loại ảnh (Anime 2D hay Ảnh chụp đời sống)
    để gợi ý mô hình AI tối ưu nhất.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Không có file được gửi lên")

    from PIL import Image
    import io

    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content))
        detection = classify_image(image)
        return {"success": True, "detection": detection}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi phân tích ảnh: {str(e)}")

@app.post("/api/upscale")
async def upscale_image(
    file: UploadFile = File(...),
    model: str = Form("auto"),
    preset: str = Form("1080p"),
    custom_scale: Optional[float] = Form(None),
    tile_size: int = Form(100),
    gpu_id: int = Form(0),
    enhance_sharpness: bool = Form(True),
    output_format: str = Form("png")
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Không có file được tải lên")

    ext = Path(file.filename).suffix or ".png"
    safe_name = f"{uuid.uuid4().hex[:8]}_{Path(file.filename).stem[:20]}{ext}"
    input_path = UPLOADS_DIR / safe_name

    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu file: {str(e)}")

    # Tự động quét và chọn mô hình nếu model="auto"
    detection_info = None
    if model == "auto" or model not in MODELS:
        try:
            detection_info = classify_image(input_path)
            model = detection_info["recommended_model"]
            print(f"[AI Auto-Detect] {detection_info['label']} -> Chon model: {model}")
        except Exception as e:
            print(f"[Auto-Detect Warning] {e}")
            model = "realesrgan-x4plus"

    try:
        result = processor.process(
            input_path=input_path,
            model_name=model,
            preset=preset,
            custom_scale=custom_scale,
            tile_size=tile_size,
            gpu_id=gpu_id,
            enhance_sharpness=enhance_sharpness,
            output_format=output_format
        )
        
        if detection_info:
            result["auto_detected"] = detection_info

        # Add to history
        HISTORY.insert(0, result)
        if len(HISTORY) > 50:
            HISTORY.pop()

        return {"success": True, "data": result}
    except Exception as e:
        print(f"[Error in upscale] {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý AI: {str(e)}")

@app.post("/api/upscale-batch")
async def upscale_batch(
    files: List[UploadFile] = File(...),
    model: str = Form("realesrgan-x4plus"),
    preset: str = Form("1080p"),
    custom_scale: Optional[float] = Form(None),
    tile_size: int = Form(400),
    gpu_id: int = Form(0),
    enhance_sharpness: bool = Form(True),
    output_format: str = Form("png")
):
    results = []
    errors = []

    for file in files:
        ext = Path(file.filename).suffix or ".png"
        safe_name = f"{uuid.uuid4().hex[:8]}_{Path(file.filename).stem[:20]}{ext}"
        input_path = UPLOADS_DIR / safe_name

        try:
            with open(input_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            res = processor.process(
                input_path=input_path,
                model_name=model,
                preset=preset,
                custom_scale=custom_scale,
                tile_size=tile_size,
                gpu_id=gpu_id,
                enhance_sharpness=enhance_sharpness,
                output_format=output_format
            )
            results.append(res)
            HISTORY.insert(0, res)
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})

    return {
        "success": True,
        "processed_count": len(results),
        "error_count": len(errors),
        "results": results,
        "errors": errors
    }

@app.get("/api/history")
def get_history():
    return {"success": True, "history": HISTORY[:30]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
