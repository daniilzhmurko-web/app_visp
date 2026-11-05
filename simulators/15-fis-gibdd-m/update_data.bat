@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PY=python
where python >nul 2>nul || set PY=py -3
%PY% --version >nul 2>nul || (
  echo Python не найден. Установите его с https://www.python.org/downloads/
  echo и поставьте галочку "Add python.exe to PATH" в начале установки.
  pause & exit /b 1
)
%PY% tools\generate_data.py && %PY% tools\validate.py && %PY% tools\build_docs.py
echo.
echo Готово. Откройте index.html двойным щелчком.
pause
