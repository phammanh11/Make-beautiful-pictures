@echo off
chcp 65001 >nul
title Cài đặt thư viện - Tạo Ảnh Đẹp AI Studio
echo =================================================================
echo   TAO ANH DEP - CAI DAT TOAN BO THU VIEN VA HE THONG
echo =================================================================
echo.

:: 1. Xác định trình thông dịch Python
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
    echo Vui lòng cài đặt Python (tối thiểu 3.10+) từ https://www.python.org hoặc Microsoft Store.
    pause
    exit /b 1
)

echo [*] Sử dụng trình thông dịch Python: %PYTHON_CMD%
%PYTHON_CMD% --version
echo.

echo [*] Nâng cấp pip...
%PYTHON_CMD% -m pip install --upgrade pip

echo [*] Cài đặt các thư viện AI & Backend từ backend/requirements.txt...
%PYTHON_CMD% -m pip install -r "%~dp0backend\requirements.txt"

:: 2. Kiểm tra Node.js & npm để build Frontend (nếu có)
echo.
echo [*] Kiểm tra môi trường Node.js cho Frontend...
where npm >nul 2>&1
if not errorlevel 1 (
    echo [*] Đang cài đặt thư viện npm và biên dịch giao diện Frontend...
    cd /d "%~dp0frontend"
    call npm install
    call npm run build
    cd /d "%~dp0"
    echo [OK] Đã hoàn tất cài đặt và build frontend!
) else (
    echo [i] Node.js chưa được cài đặt. Nếu đã có sẵn thư mục frontend/dist, bạn vẫn sử dụng bình thường.
)

echo.
echo =================================================================
echo [OK] Cài đặt hoàn tất! Bạn chỉ cần nhấp đúp file run_app.bat để bắt đầu.
echo =================================================================
pause
