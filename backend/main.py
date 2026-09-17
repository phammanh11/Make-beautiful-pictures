import os
import shutil
import uuid
import asyncio
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import (
    UPLOADS_DIR,
    OUTPUTS_DIR,
    MODELS,
    RESOLUTION_PRESETS
)
from processor import UpscaleProcessor
from classifier import classify_image
from history_manager import HistoryManager

app = FastAPI(
    title="AI Image Super-Resolution Studio API",
    description="High Performance AI Super-Resolution (720p to 1080p, 2K, 4K, 8K) powered by Real-ESRGAN, Vulkan & GFPGAN Face Restoration",
    version="2.1.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")
app.mount("/engine-static", StaticFiles(directory=str(Path(__file__).parent / "engine")), name="engine")

FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/")
    def serve_frontend_root():
        return FileResponse(FRONTEND_DIST / "index.html")

processor = UpscaleProcessor()
history_mgr = HistoryManager()

@app.get("/api/health")
def health_check():
    return {
        "status": "ok", 
        "message": "AI Super-Resolution & GFPGAN Face Restoration Engine is ready",
        "face_restorer_ready": processor.face_restorer.is_ready
    }

@app.get("/api/system-info")
def get_system_info():
    storage = history_mgr.get_storage_stats()
    return {
        "device": {
            "gpu": "Intel(R) Iris(R) Xe Graphics (Vulkan & DirectML Active)",
            "cpu": "13th Gen Intel(R) Core(TM) i5-13500H (16 Threads)",
            "vulkan_supported": True,
            "directml_supported": True,
            "engine": "Real-ESRGAN NCNN Vulkan + GFPGAN v1.4 ONNX + Lanczos-4 SuperSampling"
        },
        "models": MODELS,
        "presets": RESOLUTION_PRESETS,
        "storage": storage,
        "face_restorer": {
            "ready": processor.face_restorer.is_ready,
            "model": "GFPGANv1.4 (ONNX DirectML / CPU)",
            "detector": "OpenCV YuNet Face Detector"
        }
    }

@app.get("/api/samples")
def get_samples():
    return {
        "samples": [
            {"id": "photo", "name": "Ảnh Mẫu Chân Dung & Đời Sống", "url": "/engine-static/input.jpg"},
            {"id": "anime", "name": "Ảnh Mẫu Anime & Tranh Vẽ 2D", "url": "/engine-static/input2.jpg"}
        ]
    }

@app.post("/api/detect-model")
async def detect_model_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Không có file được gửi lên")

    from PIL import Image
    import io

    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content))
        detection = await asyncio.to_thread(classify_image, image)
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
    sharpen_percent: int = Form(120),
    detail_blend: float = Form(0.40),
    enhance_face: bool = Form(True),
    face_strength: float = Form(0.85),
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

    # Tự động quét và chọn mô hình nếu model='auto'
    detection_info = None
    if model == "auto" or model not in MODELS:
        try:
            detection_info = await asyncio.to_thread(classify_image, input_path)
            model = detection_info["recommended_model"]
            print(f"[AI Auto-Detect] {detection_info['label']} -> Chon model: {model}")
        except Exception as e:
            print(f"[Auto-Detect Warning] {e}")
            model = "realesrgan-x4plus"

    try:
        # Non-blocking AI Execution
        result = await asyncio.to_thread(
            processor.process,
            input_path=input_path,
            model_name=model,
            preset=preset,
            custom_scale=custom_scale,
            tile_size=tile_size,
            gpu_id=gpu_id,
            enhance_sharpness=enhance_sharpness,
            sharpen_percent=sharpen_percent,
            detail_blend=detail_blend,
            enhance_face=enhance_face,
            face_strength=face_strength,
            output_format=output_format
        )
        
        if detection_info:
            result["auto_detected"] = detection_info

        # Lưu lịch sử bền vững SQLite
        history_mgr.add_item(result)

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
    tile_size: int = Form(100),
    gpu_id: int = Form(0),
    enhance_sharpness: bool = Form(True),
    sharpen_percent: int = Form(120),
    detail_blend: float = Form(0.40),
    enhance_face: bool = Form(True),
    face_strength: float = Form(0.85),
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
            
            res = await asyncio.to_thread(
                processor.process,
                input_path=input_path,
                model_name=model,
                preset=preset,
                custom_scale=custom_scale,
                tile_size=tile_size,
                gpu_id=gpu_id,
                enhance_sharpness=enhance_sharpness,
                sharpen_percent=sharpen_percent,
                detail_blend=detail_blend,
                enhance_face=enhance_face,
                face_strength=face_strength,
                output_format=output_format
            )
            results.append(res)
            history_mgr.add_item(res)
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})

    return {
        "success": True,
        "processed_count": len(results),
        "error_count": len(errors),
        "results": results,
        "errors": errors
    }

# --- History & Storage Management Endpoints ---

@app.get("/api/history")
def get_history(limit: int = 100, offset: int = 0):
    try:
        history_mgr.sync_with_disk()
    except Exception as e:
        print(f"[History API] Sync error: {e}")
    items = history_mgr.get_history(limit=limit, offset=offset)
    storage = history_mgr.get_storage_stats()
    return {"success": True, "history": items, "storage": storage}

@app.post("/api/history/sync")
def sync_history_endpoint():
    sync_stats = history_mgr.sync_with_disk()
    items = history_mgr.get_history(limit=100)
    storage = history_mgr.get_storage_stats()
    return {"success": True, "sync": sync_stats, "history": items, "storage": storage}

@app.delete("/api/history/{job_id}")
def delete_history_item(job_id: str):
    res = history_mgr.delete_item(job_id)
    storage = history_mgr.get_storage_stats()
    return {
        "success": True, 
        "freed": res.get("freed_human", "0 B"),
        "message": f"Đã xóa thành công và giải phóng {res.get('freed_human', '0 B')}", 
        "storage": storage
    }

@app.delete("/api/history")
def clear_all_history():
    res = history_mgr.clear_all()
    storage = history_mgr.get_storage_stats()
    return {
        "success": True, 
        "cleared_count": res.get("deleted_count", 0), 
        "freed": res.get("freed_human", "0 B"),
        "message": f"Đã xóa toàn bộ và giải phóng {res.get('freed_human', '0 B')} dung lượng ổ đĩa",
        "storage": storage
    }

class ZipDownloadRequest(BaseModel):
    job_ids: Optional[List[str]] = None

@app.post("/api/history/download-zip")
async def download_history_zip(req: ZipDownloadRequest = Body(default=ZipDownloadRequest())):
    zip_path = await asyncio.to_thread(history_mgr.create_zip, req.job_ids)
    if not zip_path.exists():
        raise HTTPException(status_code=500, detail="Không thể tạo file ZIP")
    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename=zip_path.name
    )

@app.get("/api/storage-info")
def get_storage_info():
    return {"success": True, "stats": history_mgr.get_storage_stats()}

@app.post("/api/cleanup")
def cleanup_storage(max_age_hours: float = 24.0, keep_latest: int = 50):
    res = history_mgr.cleanup_old_files(max_age_hours=max_age_hours, keep_latest=keep_latest)
    stats = history_mgr.get_storage_stats()
    return {"success": True, "cleanup": res, "current_storage": stats}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
