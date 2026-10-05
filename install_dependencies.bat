@echo off
title Cai dat thu vien - Tao Anh Dep AI Studio
echo =================================================================
echo   TAO ANH DEP - CAI DAT TOAN BO THU VIEN VA HE THONG
echo =================================================================
echo.

set PYTHON_CMD=py
py --version >nul 2>&1
if errorlevel 1 (
    set PYTHON_CMD=python
)

echo [*] Su dung trinh thong dich: %PYTHON_CMD%
%PYTHON_CMD% --version
echo.

echo [*] Nang cap pip...
%PYTHON_CMD% -m pip install --upgrade pip

echo [*] Cai dat cac thu vien tu backend/requirements.txt...
%PYTHON_CMD% -m pip install -r "%~dp0backend\requirements.txt"

echo.
echo =================================================================
echo [OK] Cai dat hoan tat! Ban co the chay run_app.bat de bat dau.
echo =================================================================
pause
