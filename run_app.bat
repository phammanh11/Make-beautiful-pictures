@echo off
title Tao Anh Dep - AI Image Super-Resolution Studio
echo ======================================================
echo    Tao Anh Dep - AI Ultra Image Upscaler ^& Enhancer
echo    Hardware Acceleration: Intel Iris Xe via Vulkan
echo ======================================================
echo.

:: 1. Kiem tra va dong tien trinh cu dang chiem cong 8000 (neu co)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [*] Dang dong tien trinh server cu PID %%a ...
    taskkill /f /pid %%a >nul 2>&1
    ping 127.0.0.1 -n 2 >nul
)

cd /d "%~dp0backend"
echo [*] Khoi dong FastAPI Backend va AI Engine...

:: Xac dinh lenh python kha dung
set PYTHON_CMD=py
py --version >nul 2>&1
if errorlevel 1 (
    set PYTHON_CMD=python
)

echo [*] May chu dang chay tai: http://127.0.0.1:8000
echo [*] Trinh duyet se tu dong mo len ngay khi may chu san sang.
echo [*] Nhan Ctrl + C de dung ung dung.
echo.

%PYTHON_CMD% -m uvicorn main:app --host 127.0.0.1 --port 8000

pause
