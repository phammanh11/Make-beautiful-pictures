@echo off
title Tao Anh Dep - AI Studio Desktop Mode
echo =================================================================
echo   TAO ANH DEP - AI MEDIA STUDIO (NATIVE WINDOW MODE)
echo   Hardware Acceleration: Intel Iris Xe via Vulkan & DirectML
echo =================================================================
echo.

:: 1. Dong tien trinh cu tren cong 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [*] Dang dong server cu PID %%a ...
    taskkill /f /pid %%a >nul 2>&1
    ping 127.0.0.1 -n 2 >nul
)

:: 2. Xac dinh python
set PYTHON_CMD=py
py --version >nul 2>&1
if errorlevel 1 (
    set PYTHON_CMD=python
)

cd /d "%~dp0backend"
echo [*] Dang khoi dong Backend Engine...
set NO_BROWSER=1
start "Tao Anh Dep Server" /min %PYTHON_CMD% -m uvicorn main:app --host 127.0.0.1 --port 8000

echo [*] Cho server san sang (2s)...
ping 127.0.0.1 -n 3 >nul

echo [*] Mo giao dien Desktop App...
:: Thu tim Microsoft Edge hoac Google Chrome de mo o che do App Frameless
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:8000 --window-size=1440,920
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:8000 --window-size=1440,920
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://127.0.0.1:8000 --window-size=1440,920
) else (
    start http://127.0.0.1:8000
)

echo.
echo [*] Ung dung dang chay o che do cua so Desktop!
echo [*] Dong cua so nay hoac nhan bat ky phim nao de thoat server...
pause >nul

:: Dong server khi tat
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
exit
