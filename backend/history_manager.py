import os
import json
import time
import zipfile
import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional
from PIL import Image

from config import BASE_DIR, UPLOADS_DIR, OUTPUTS_DIR

DB_PATH = BASE_DIR / "history.db"

class HistoryManager:
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._init_db()
        try:
            self.sync_with_disk()
        except Exception as e:
            print(f"[HistoryManager] Init sync warning: {e}")

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=30.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("PRAGMA journal_mode = WAL;")
            conn.execute("PRAGMA synchronous = NORMAL;")
            conn.execute("""
                CREATE TABLE IF NOT EXISTS history (
                    job_id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    model_used TEXT,
                    preset_used TEXT,
                    effective_scale REAL,
                    elapsed_seconds REAL,
                    download_url TEXT,
                    original_url TEXT,
                    input_meta TEXT,
                    output_meta TEXT,
                    auto_detected TEXT
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_history_created ON history(created_at DESC)")

    def sync_with_disk(self) -> Dict[str, int]:
        """
        Quet toan bo thu muc outputs/ va uploads/ tren dia:
        1. Phuc hoi toan bo anh da tung upscale (ke ca sau khi restart app).
        2. Tu dong don cac ban ghi DB mo coi neu file anh da bi xoa ngoai Windows Explorer.
        """
        synced_count = 0
        cleaned_count = 0

        with self._get_connection() as conn:
            cursor = conn.execute("SELECT job_id, filename FROM history")
            db_records = {row["filename"]: row["job_id"] for row in cursor.fetchall()}

        # 1. Kiem tra file trong DB co con tren dia khong
        for filename, job_id in list(db_records.items()):
            out_file = OUTPUTS_DIR / filename
            if not out_file.exists():
                with self._get_connection() as conn:
                    conn.execute("DELETE FROM history WHERE job_id = ?", (job_id,))
                cleaned_count += 1
                del db_records[filename]

        # 2. Quet cac file anh trong outputs/
        valid_exts = {".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif"}
        if OUTPUTS_DIR.exists():
            for f in sorted(OUTPUTS_DIR.glob("*"), key=lambda x: x.stat().st_mtime, reverse=True):
                if not f.is_file() or f.suffix.lower() not in valid_exts or f.name.startswith("."):
                    continue
                if f.name.startswith("upscaled_bundle_"):
                    continue

                if f.name in db_records:
                    continue

                try:
                    with Image.open(f) as img:
                        w, h = img.size
                        fmt = img.format or f.suffix[1:].upper()
                        mode = img.mode

                    f_size = f.stat().st_size
                    created_at = f.stat().st_mtime

                    stem = f.stem
                    if stem.startswith("upscaled_"):
                        parts = stem.split("_")
                        job_id = parts[1] if len(parts) > 1 else stem[:12]
                    else:
                        job_id = stem[:16]

                    max_dim = max(w, h)
                    if max_dim >= 7000:
                        preset = "8k"
                    elif max_dim >= 3500:
                        preset = "4k"
                    elif max_dim >= 2400:
                        preset = "2k"
                    elif max_dim >= 1800:
                        preset = "1080p"
                    else:
                        preset = "4x"

                    orig_url = f"/outputs/{f.name}"
                    upload_files = list(UPLOADS_DIR.glob(f"*{job_id}*"))
                    if upload_files:
                        orig_url = f"/uploads/{upload_files[0].name}"

                    out_meta = {
                        "width": w,
                        "height": h,
                        "aspect_ratio": round(w / h, 2) if h > 0 else 1.0,
                        "megapixels": round((w * h) / 1_000_000, 2),
                        "format": fmt,
                        "mode": mode,
                        "size_bytes": f_size,
                        "size_human": self._format_size(f_size)
                    }

                    in_w = max(1, int(round(w / 4)))
                    in_h = max(1, int(round(h / 4)))
                    in_meta = {
                        "width": in_w,
                        "height": in_h,
                        "aspect_ratio": round(in_w / in_h, 2) if in_h > 0 else 1.0,
                        "megapixels": round((in_w * in_h) / 1_000_000, 2),
                        "size_human": self._format_size(int(f_size / 6))
                    }

                    item = {
                        "job_id": job_id,
                        "filename": f.name,
                        "created_at": created_at,
                        "model_used": "realesrgan-x4plus",
                        "preset_used": preset,
                        "effective_scale": 4.0,
                        "elapsed_seconds": 6.5,
                        "download_url": f"/outputs/{f.name}",
                        "original_url": orig_url,
                        "input": in_meta,
                        "output": out_meta
                    }
                    self.add_item(item)
                    synced_count += 1
                except Exception as e:
                    print(f"[HistoryManager] Warning indexing {f.name}: {e}")

        return {"synced_count": synced_count, "cleaned_count": cleaned_count}

    def add_item(self, item: Dict[str, Any]):
        job_id = item.get("job_id", "")
        filename = item.get("filename", "")
        created_at = item.get("created_at") or time.time()
        model_used = item.get("model_used", "")
        preset_used = item.get("preset_used", "")
        effective_scale = item.get("effective_scale", 1.0)
        elapsed_seconds = item.get("elapsed_seconds", 0.0)
        download_url = item.get("download_url", "")
        original_url = item.get("original_url", "")
        input_meta = json.dumps(item.get("input", {}), ensure_ascii=False)
        output_meta = json.dumps(item.get("output", {}), ensure_ascii=False)
        auto_detected = json.dumps(item.get("auto_detected", {}), ensure_ascii=False) if "auto_detected" in item else None

        with self._get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO history (
                    job_id, filename, created_at, model_used, preset_used,
                    effective_scale, elapsed_seconds, download_url, original_url,
                    input_meta, output_meta, auto_detected
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                job_id, filename, created_at, model_used, preset_used,
                effective_scale, elapsed_seconds, download_url, original_url,
                input_meta, output_meta, auto_detected
            ))

    def get_history(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM history ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset)
            )
            rows = cursor.fetchall()
            results = []
            for row in rows:
                item = {
                    "job_id": row["job_id"],
                    "filename": row["filename"],
                    "created_at": row["created_at"],
                    "model_used": row["model_used"],
                    "preset_used": row["preset_used"],
                    "effective_scale": row["effective_scale"],
                    "elapsed_seconds": row["elapsed_seconds"],
                    "download_url": row["download_url"],
                    "original_url": row["original_url"],
                    "input": json.loads(row["input_meta"]) if row["input_meta"] else {},
                    "output": json.loads(row["output_meta"]) if row["output_meta"] else {}
                }
                if row["auto_detected"]:
                    item["auto_detected"] = json.loads(row["auto_detected"])
                results.append(item)
            return results

    def delete_item(self, job_id: str) -> Dict[str, Any]:
        """
        Xoa mot muc lich su va xoa file anh tren dia de giai phong bo nho.
        """
        freed_bytes = 0
        filename = None
        original_url = None

        with self._get_connection() as conn:
            cursor = conn.execute("SELECT filename, download_url, original_url FROM history WHERE job_id = ?", (job_id,))
            row = cursor.fetchone()
            if row:
                filename = row["filename"]
                original_url = row["original_url"]
                conn.execute("DELETE FROM history WHERE job_id = ?", (job_id,))

        if filename:
            output_file = OUTPUTS_DIR / filename
            if output_file.exists():
                try:
                    freed_bytes += output_file.stat().st_size
                    output_file.unlink()
                except Exception as e:
                    print(f"[HistoryManager] Warning removing output: {e}")

        if original_url and original_url.startswith("/uploads/"):
            orig_name = original_url.replace("/uploads/", "")
            orig_file = UPLOADS_DIR / orig_name
            if orig_file.exists():
                try:
                    freed_bytes += orig_file.stat().st_size
                    orig_file.unlink()
                except Exception as e:
                    print(f"[HistoryManager] Warning removing upload: {e}")

        if job_id:
            for f in OUTPUTS_DIR.glob(f"*{job_id}*"):
                try:
                    freed_bytes += f.stat().st_size
                    f.unlink()
                except Exception:
                    pass
            for f in UPLOADS_DIR.glob(f"*{job_id}*"):
                try:
                    freed_bytes += f.stat().st_size
                    f.unlink()
                except Exception:
                    pass

        return {
            "success": True,
            "job_id": job_id,
            "freed_bytes": freed_bytes,
            "freed_human": self._format_size(freed_bytes)
        }

    def clear_all(self) -> Dict[str, Any]:
        """
        Xoa toan bo lich su va giai phong 100% dung luong outputs/ & uploads/.
        """
        freed_bytes = 0
        deleted_count = 0

        if OUTPUTS_DIR.exists():
            for f in OUTPUTS_DIR.glob("*"):
                if f.is_file() and f.name != ".gitkeep":
                    try:
                        freed_bytes += f.stat().st_size
                        f.unlink()
                        deleted_count += 1
                    except Exception as e:
                        print(f"[HistoryManager] Error deleting {f.name}: {e}")

        if UPLOADS_DIR.exists():
            for f in UPLOADS_DIR.glob("*"):
                if f.is_file() and f.name != ".gitkeep":
                    try:
                        freed_bytes += f.stat().st_size
                        f.unlink()
                    except Exception as e:
                        print(f"[HistoryManager] Error deleting {f.name}: {e}")

        with self._get_connection() as conn:
            conn.execute("DELETE FROM history")

        return {
            "deleted_count": deleted_count,
            "freed_bytes": freed_bytes,
            "freed_human": self._format_size(freed_bytes)
        }

    def create_zip(self, job_ids: Optional[List[str]] = None) -> Path:
        zip_filename = f"upscaled_bundle_{int(time.time())}.zip"
        zip_path = OUTPUTS_DIR / zip_filename

        items = self.get_history(limit=500)
        if job_ids:
            job_set = set(job_ids)
            items = [item for item in items if item["job_id"] in job_set]

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for item in items:
                filepath = OUTPUTS_DIR / item["filename"]
                if filepath.exists():
                    zipf.write(filepath, arcname=item["filename"])

        return zip_path

    def get_storage_stats(self) -> Dict[str, Any]:
        def get_dir_size(path: Path) -> int:
            total = 0
            if path.exists():
                for f in path.glob("*"):
                    if f.is_file() and f.name != ".gitkeep":
                        total += f.stat().st_size
            return total

        uploads_size = get_dir_size(UPLOADS_DIR)
        outputs_size = get_dir_size(OUTPUTS_DIR)

        with self._get_connection() as conn:
            cursor = conn.execute("SELECT COUNT(*) as count FROM history")
            total_items = cursor.fetchone()["count"]

        return {
            "uploads_bytes": uploads_size,
            "outputs_bytes": outputs_size,
            "total_bytes": uploads_size + outputs_size,
            "uploads_human": self._format_size(uploads_size),
            "outputs_human": self._format_size(outputs_size),
            "total_human": self._format_size(uploads_size + outputs_size),
            "history_count": total_items
        }

    def cleanup_old_files(self, max_age_hours: float = 24.0, keep_latest: int = 50) -> Dict[str, int]:
        now = time.time()
        cutoff = now - (max_age_hours * 3600)
        removed_count = 0

        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT job_id FROM history WHERE created_at < ? ORDER BY created_at ASC",
                (cutoff,)
            )
            old_rows = cursor.fetchall()
            for r in old_rows:
                res = self.delete_item(r["job_id"])
                if res.get("success"):
                    removed_count += 1

            cursor = conn.execute("SELECT COUNT(*) as count FROM history")
            total = cursor.fetchone()["count"]
            if total > keep_latest:
                excess = total - keep_latest
                cursor = conn.execute(
                    "SELECT job_id FROM history ORDER BY created_at ASC LIMIT ?",
                    (excess,)
                )
                excess_rows = cursor.fetchall()
                for r in excess_rows:
                    res = self.delete_item(r["job_id"])
                    if res.get("success"):
                        removed_count += 1

        return {"cleaned_items": removed_count}

    def _format_size(self, size_bytes: int) -> str:
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.2f} MB"
