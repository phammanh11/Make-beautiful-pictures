@echo off
chcp 65001 >nul
title Tạo Ảnh Đẹp - AI Ultra Media Studio (Image & Video 4K)
echo =================================================================
echo   TAO ANH DEP - AI ULTRA MEDIA STUDIO (IMAGE & VIDEO 4K)
echo   Hardware Acceleration: Intel Iris Xe via Vulkan & DirectML
echo =================================================================
echo.

:: 1. Kiểm tra trình thông dịch Python
set PYTHON_CMD=
py --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=py
) else (
    python --version >nul 2>&1
    if not errorlevel 1 (
        set PYTHON_CMD=python
    )
)

if "%PYTHON_CMD%"=="" (
    echo [LỖI] Không tìm thấy Python trên hệ thống!
    echo Vui lòng cài đặt Python (tối thiểu 3.10+) từ https://www.python.org hoặc Microsoft Store
    echo và tích chọn "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

:: 2. Kiểm tra và giải phóng cổng 8000 nếu có tiến trình cũ chiếm dụng
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [*] Đang đóng tiến trình server cũ đang chiếm cổng 8000 (PID %%a)...
    taskkill /f /pid %%a >nul 2>&1
    ping 127.0.0.1 -n 2 >nul
)

:: 3. Kiểm tra bản build Frontend, tự động biên dịch nếu chưa có
if not exist "%~dp0frontend\dist\index.html" (
    echo [*] Chưa tìm thấy bản build giao diện (frontend/dist). Đang kiểm tra Node.js...
    where npm >nul 2>&1
    if not errorlevel 1 (
        echo [*] Đang tự động biên dịch giao diện Frontend...
        cd /d "%~dp0frontend"
        call npm install
        call npm run build
        cd /d "%~dp0"
    ) else (
        echo [Cảnh báo] Chưa cài Node.js để build frontend.
        echo Hệ thống sẽ phục vụ trang hướng dẫn tại cổng 8000.
    )
)

:: 4. Chuyển vào thư mục backend và khởi động FastAPI
cd /d "%~dp0backend"
echo [*] Đang khởi động AI Engine và FastAPI Server...
echo [*] Địa chỉ truy cập: http://127.0.0.1:8000
echo [*] Cửa sổ ứng dụng Desktop sẽ tự động mở khi máy chủ sẵn sàng.
echo [*] Nhấn Ctrl + C để dừng ứng dụng.
echo.

%PYTHON_CMD% -m uvicorn main:app --host 127.0.0.1 --port 8000

echo.
echo [*] Máy chủ đã dừng.
pause
