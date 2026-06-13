@echo off
echo Starting StockIQ...

:: Start uvicorn in a new terminal window
start "Uvicorn" cmd /k "cd /d C:\Users\Administrator\Desktop\Pantry && venv\Scripts\activate && cd backend && uvicorn main:app --reload"

:: Wait 3 seconds for uvicorn to start before launching ngrok
timeout /t 3 /nobreak
c
:: Start ngrok in a new terminal window
start "Ngrok" cmd /k "ngrok http --url=default-granite-driveway.ngrok-free.dev 8000"

echo Both services started!
exit