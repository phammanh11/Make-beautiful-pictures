@echo off
title Cai dat thu vien - Tao Anh Dep AI Studio
echo =================================================================
echo   TAO ANH DEP - CAI DAT TOAN BO THU VIEN VA HE THONG
echo =================================================================
echo.

:: 1. Xac dinh trinh thong dich Python
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

echo [*] Su dung trinh thong dich: %PYTHON_CMD%
%PYTHON_CMD% --version
echo.

echo [*] Nang cap pip...
%PYTHON_CMD% -m pip install --upgrade pip

echo [*] Cai dat cac thu vien tu backend/requirements.txt...
%PYTHON_CMD% -m pip install -r "%~dp0backend\requirements.txt"

:: 2. Kiem tra Node.js va npm de build Frontend (neu co)
echo.
echo [*] Kiem tra moi truong Node.js cho Frontend...
where npm >nul 2>&1
if not errorlevel 1 (
    echo [*] Dang cai dat thu vien npm va bien dich Frontend...
    cd /d "%~dp0frontend"
    call npm install
    call npm run build
    cd /d "%~dp0"
    echo [OK] Da hoan tat cai dat va build frontend!
) else (
    echo [i] Node.js chua duoc cai dat. Neu da co san frontend/dist, ban van su dung binh thuong.
)

echo.
echo =================================================================
echo [OK] Cai dat hoan tat! Ban co the chay run_app.bat de bat dau.
echo =================================================================
pause
