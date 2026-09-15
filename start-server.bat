@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
    echo Python environment is missing. Install it first with:
    echo uv venv .venv
    echo uv pip install --python .venv\Scripts\python.exe -r requirements.txt
    pause
    exit /b 1
)
start "Al Jameh Website" /min ".venv\Scripts\python.exe" app.py
start "Al Jameh Browser" "http://127.0.0.1:5000/al-jameh-maintenance"
