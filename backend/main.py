import os
import shutil
import uuid
import asyncio
import threading
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
from bg_remover import remove_background
from video_processor import VideoUpscaleProcessor
from colorizer import PhotoColorizer

app = FastAPI(
    title="AI Super-Resolution & Media Studio API",
    description="High Performance AI Super-Resolution (Image & Video 4K/8K), Background Remover & Colorizer",
    version="3.0.0"
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

    @app.get("/favicon.svg")
    def serve_favicon():
        fav = FRONTEND_DIST / "favicon.svg"
        if fav.exists():
            return FileResponse(fav)
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/icons.svg")
    def serve_icons():
        ico = FRONTEND_DIST / "icons.svg"
        if ico.exists():
            return FileResponse(ico)
        return FileResponse(FRONTEND_DIST / "index.html")

processor = UpscaleProcessor()
history_mgr = HistoryManager()
video_processor = VideoUpscaleProcessor()
colorizer = PhotoColorizer()

@app.on_event("startup")
def on_startup():
    if os.environ.get("NO_BROWSER") != "1":
        def _open():
            import time
            import webbrowser
            time.sleep(0.8)
            try:
                webbrowser.open("http://127.0.0.1:8000")
            except Exception as e:
                print(f"[Browser Auto-Open] {e}")
        threading.Thread(target=_open, daemon=True).start()

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

from fastapi.responses import FileResponse, StreamingResponse
import json

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
    enable_clahe: bool = Form(False),
    enable_denoise: bool = Form(False),
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
            enable_clahe=enable_clahe,
            enable_denoise=enable_denoise,
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

@app.post("/api/upscale-stream")
async def upscale_image_stream(
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
    enable_clahe: bool = Form(False),
    enable_denoise: bool = Form(False),
    output_format: str = Form("png")
):
    """
    Endpoint SSE trả về tiến trình thực từ GPU Vulkan & GFPGAN theo thời gian thực
    """
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

    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def progress_cb(percent: float, stage: str, message: str):
            loop.call_soon_threadsafe(queue.put_nowait, {
                "type": "progress",
                "percent": percent,
                "stage": stage,
                "message": message
            })

        def run_worker():
            nonlocal model
            try:
                progress_cb(2.0, "init", "Đang nhận diện đặc trưng ảnh...")
                detection_info = None
                if model == "auto" or model not in MODELS:
                    try:
                        detection_info = classify_image(input_path)
                        model = detection_info["recommended_model"]
                        progress_cb(5.0, "init", f"Phát hiện: {detection_info['label']} ➔ Sử dụng {model}")
                    except Exception as e:
                        print(f"[Auto-Detect Warning] {e}")
                        model = "realesrgan-x4plus"

                res = processor.process(
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
                    enable_clahe=enable_clahe,
                    enable_denoise=enable_denoise,
                    output_format=output_format,
                    progress_callback=progress_cb
                )

                if detection_info:
                    res["auto_detected"] = detection_info

                history_mgr.add_item(res)
                loop.call_soon_threadsafe(queue.put_nowait, {
                    "type": "complete",
                    "data": res
                })
            except Exception as ex:
                print(f"[Worker Exception] {ex}")
                loop.call_soon_threadsafe(queue.put_nowait, {
                    "type": "error",
                    "error": str(ex)
                })
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        threading.Thread(target=run_worker, daemon=True).start()

        while True:
            event = await queue.get()
            if event is None:
                break
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

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
    enable_clahe: bool = Form(False),
    enable_denoise: bool = Form(False),
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
                enable_clahe=enable_clahe,
                enable_denoise=enable_denoise,
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

# --- Background Removal Endpoint ---
@app.post("/api/remove-bg")
async def remove_background_endpoint(
    file: UploadFile = File(...),
    bg_mode: str = Form("transparent"), # transparent, white, color, blur
    bg_color: str = Form("#ffffff"),
    blur_radius: int = Form(15),
    feather_radius: int = Form(1)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Chưa có file ảnh được tải lên")

    job_id = uuid.uuid4().hex[:8]
    ext = ".png" if bg_mode == "transparent" else ".jpg"
    final_filename = f"nobg_{job_id}{ext}"
    final_output_path = OUTPUTS_DIR / final_filename

    # Đọc ảnh từ upload
    content = await file.read()
    from PIL import Image
    import io
    image = Image.open(io.BytesIO(content))

    try:
        result_img = await asyncio.to_thread(
            remove_background,
            image,
            bg_mode=bg_mode,
            bg_color=bg_color,
            blur_radius=blur_radius,
            feather_radius=feather_radius
        )
        if bg_mode == "transparent":
            result_img.save(final_output_path, format="PNG")
        else:
            result_img.save(final_output_path, format="JPEG", quality=95)

        file_size = final_output_path.stat().st_size
        return {
            "success": True,
            "job_id": job_id,
            "filename": final_filename,
            "width": result_img.width,
            "height": result_img.height,
            "bg_mode": bg_mode,
            "download_url": f"/outputs/{final_filename}",
            "size_human": f"{file_size / 1024:.1f} KB"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tách nền: {str(e)}")

# --- Colorization Endpoint ---
@app.post("/api/colorize")
async def colorize_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Chưa có file ảnh được tải lên")

    job_id = uuid.uuid4().hex[:8]
    final_filename = f"colorized_{job_id}.jpg"
    final_output_path = OUTPUTS_DIR / final_filename

    content = await file.read()
    from PIL import Image
    import io
    image = Image.open(io.BytesIO(content))

    try:
        colorized_img = await asyncio.to_thread(colorizer.colorize_image, image)
        colorized_img.save(final_output_path, format="JPEG", quality=95)

        file_size = final_output_path.stat().st_size
        return {
            "success": True,
            "job_id": job_id,
            "filename": final_filename,
            "width": colorized_img.width,
            "height": colorized_img.height,
            "download_url": f"/outputs/{final_filename}",
            "size_human": f"{file_size / 1024:.1f} KB"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tô màu ảnh: {str(e)}")

# --- Video Super-Resolution Endpoints ---
@app.post("/api/video/info")
async def get_video_info_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Chưa có file video")

    temp_video = UPLOADS_DIR / f"temp_{uuid.uuid4().hex[:8]}_{file.filename}"
    with open(temp_video, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        info = video_processor.get_video_info(temp_video)
        return {"success": True, "info": info, "temp_path": temp_video.name}
    except Exception as e:
        if temp_video.exists():
            temp_video.unlink()
        raise HTTPException(status_code=500, detail=f"Lỗi khi đọc video: {str(e)}")

@app.post("/api/video/upscale-stream")
async def video_upscale_stream(
    file: UploadFile = File(...),
    scale: int = Form(2),
    model: str = Form("realesr-animevideov3"),
    tile_size: int = Form(100),
    gpu_id: int = Form(0)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Chưa có file video được tải lên")

    ext = Path(file.filename).suffix or ".mp4"
    safe_name = f"vid_{uuid.uuid4().hex[:8]}_{Path(file.filename).stem[:20]}{ext}"
    input_video_path = UPLOADS_DIR / safe_name

    try:
        with open(input_video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu video: {str(e)}")

    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def progress_cb(percent: float, stage: str, message: str):
            loop.call_soon_threadsafe(queue.put_nowait, {
                "type": "progress",
                "percent": percent,
                "stage": stage,
                "message": message
            })

        def run_worker():
            try:
                progress_cb(1.0, "init", "Bắt đầu tải video vào bộ nhớ xử lý...")
                res = video_processor.process_video(
                    input_video_path=input_video_path,
                    scale=scale,
                    model_name=model,
                    tile_size=tile_size,
                    gpu_id=gpu_id,
                    progress_callback=progress_cb
                )
                loop.call_soon_threadsafe(queue.put_nowait, {
                    "type": "complete",
                    "data": res
                })
            except Exception as ex:
                print(f"[Video Worker Exception] {ex}")
                loop.call_soon_threadsafe(queue.put_nowait, {
                    "type": "error",
                    "error": str(ex)
                })
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        threading.Thread(target=run_worker, daemon=True).start()

        while True:
            event = await queue.get()
            if event is None:
                break
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

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
