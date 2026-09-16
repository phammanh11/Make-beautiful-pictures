@echo off
title Tao Anh Dep - AI Image Super-Resolution
echo ======================================================
echo    Tao Anh Dep - AI Ultra Image Upscaler ^& Enhancer
echo    Hardware Acceleration: Intel Iris Xe via Vulkan
echo ======================================================
echo.

:: Kiem tra neu port 8000 da duoc bat truoc do
netstat -ano | findstr ":8000.*LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    echo [Thong bao] Server da dang chay san tai cong 8000!
    echo Dang mo trinh duyet toi http://127.0.0.1:8000 ...
    start http://127.0.0.1:8000
    goto :end
)

cd /d "%~dp0backend"
echo [1/2] Khoi dong FastAPI Backend va AI Engine tai http://127.0.0.1:8000 ...
start /b py -m uvicorn main:app --host 127.0.0.1 --port 8000

timeout /t 2 /nobreak >nul
echo [2/2] Mo trinh duyet toi http://127.0.0.1:8000 ...
start http://127.0.0.1:8000

:end
echo.
echo ======================================================
echo    Ung dung dang hoat dong tai: http://127.0.0.1:8000
echo    Ban co the dong cua so nay khi khong can dung.
echo ======================================================
echo.
pause
