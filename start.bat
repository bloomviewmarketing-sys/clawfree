@echo off
echo.
echo    _____ _               ______
echo   / ____^| ^|             ^|  ____^|
echo  ^| ^|    ^| ^| __ ___      ^| ^|__ _ __ ___  ___
echo  ^| ^|    ^| ^|/ _` \ \ /\ / /  _^| '__/ _ \/ _ \
echo  ^| ^|____^| ^| (_^| ^|\ V  V /^| ^| ^| ^| ^|  __/  __/
echo   \_____^|_^|\__,_^| \_/\_/ ^|_^| ^|_^|  \___^|\___^|
echo.
echo   Open-source AI agent platform
echo   =============================================
echo.

:: Create logs directory if needed
if not exist "C:\Users\dillo\clawfree\logs" mkdir "C:\Users\dillo\clawfree\logs"

:: Set local mode env vars
set NEXT_PUBLIC_LOCAL_MODE=true
set NEXT_PUBLIC_GATEWAY_URL=http://localhost:4000

:: Start the gateway in background
echo   [1/3] Starting gateway on port 4000...
start /B cmd /c "cd /d C:\Users\dillo\clawfree && pnpm dev:gateway > logs\gateway.log 2>&1"

:: Wait for gateway to be ready
timeout /t 3 /nobreak > nul

:: Start the dashboard in background
echo   [2/3] Starting dashboard on port 3000...
start /B cmd /c "cd /d C:\Users\dillo\clawfree\packages\dashboard && set NEXT_PUBLIC_LOCAL_MODE=true && set NEXT_PUBLIC_GATEWAY_URL=http://localhost:4000 && npx next dev --port 3000 > ..\..\logs\dashboard.log 2>&1"

:: Wait for dashboard to be ready
timeout /t 4 /nobreak > nul

:: Open browser
echo   [3/3] Opening dashboard...
start http://localhost:3000/chat

echo.
echo   =============================================
echo   Gateway:   http://localhost:4000
echo   Dashboard: http://localhost:3000/chat
echo   =============================================
echo.
echo   Press Ctrl+C to stop
echo.

:: Start Cloudflare tunnel (keeps the terminal open)
echo   Starting Cloudflare tunnel for remote access...
echo   Your public gateway URL will appear below:
echo   ---------------------------------------------
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:4000
