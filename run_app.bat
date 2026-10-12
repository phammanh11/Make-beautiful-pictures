@echo off
title Tao Anh Dep - AI Ultra Media Studio
echo =================================================================
echo   TAO ANH DEP - AI ULTRA MEDIA STUDIO (IMAGE AND VIDEO 4K)
echo   Hardware Acceleration: Intel Iris Xe via Vulkan and DirectML
echo =================================================================
echo.

:: 1. Kiem tra trinh thong dich Python
set PYTHON_CMD=py
py --version >nul 2>&1
if errorlevel 1 (
    set PYTHON_CMD=python
    python --version >nul 2>&1
    if errorlevel 1 (
        echo [LOI] Khong tim thay Python tren he thong!
        echo Vui long cai dat Python tu https://www.python.org hoac Microsoft Store.
        pause
        exit /b 1
    )
)

echo [*] Trinh thong dich Python: %PYTHON_CMD%

:: 2. Giai phong cong 8000 neu co tien trinh cu chiem dung
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [*] Dang dong server cu dang chiem cong 8000 PID %%a ...
    taskkill /f /pid %%a >nul 2>&1
    ping 127.0.0.1 -n 2 >nul
)

:: 3. Kiem tra thu muc frontend/dist, tu dong build neu chua co
if not exist "%~dp0frontend\dist\index.html" (
    echo [*] Chua tim thay frontend/dist. Dang kiem tra Node.js...
    where npm >nul 2>&1
    if not errorlevel 1 (
        echo [*] Dang tu dong bien dich Frontend bang npm...
        cd /d "%~dp0frontend"
        call npm install
        call npm run build
        cd /d "%~dp0"
    ) else (
        echo [Canh bao] Chua co Node.js de build frontend.
    )
)

:: 4. Chuyen vao backend va khoi dong FastAPI
cd /d "%~dp0backend"
echo [*] Dang khoi dong AI Engine va FastAPI Server...
echo [*] Dia chi truy cap: http://127.0.0.1:8000
echo [*] Cua so ung dung se tu dong bat len ngay khi may chu san sang.
echo [*] Nhan Ctrl + C de dung ung dung.
echo.

%PYTHON_CMD% -m uvicorn main:app --host 127.0.0.1 --port 8000

echo.
echo [*] May chu da dung.
pause
