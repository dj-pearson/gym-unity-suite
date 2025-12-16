@echo off
REM Local Edge Functions Testing Script for Windows
REM This script helps test edge functions locally before deploying

echo Starting Local Edge Functions Server
echo.

REM Check if .env file exists
if not exist .env (
    echo .env file not found. Creating from example...
    (
        echo # Supabase Configuration (REQUIRED^)
        echo SUPABASE_URL=https://api.repclub.net
        echo SUPABASE_ANON_KEY=your_anon_key_here
        echo SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
        echo.
        echo # Optional API Keys (only needed for specific functions^)
        echo OPENAI_API_KEY=
        echo STRIPE_SECRET_KEY=
        echo STRIPE_WEBHOOK_SECRET=
        echo RESEND_API_KEY=
        echo.
        echo # Runtime Configuration
        echo PORT=8000
        echo DENO_ENV=development
        echo PRELOAD_FUNCTIONS=false
    ) > .env
    echo Please edit .env file with your actual credentials
    pause
    exit /b 1
)

REM Check if Deno is installed
where deno >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Deno is not installed
    echo Please install Deno: https://deno.land/#installation
    pause
    exit /b 1
)

echo Deno found
deno --version
echo.

REM Set environment variables from .env file (basic parsing)
for /f "tokens=1,2 delims==" %%a in (.env) do (
    set %%a=%%b
)

REM Set up functions path
if "%PORT%"=="" set PORT=8000
set FUNCTIONS_PATH=./supabase/functions

echo Functions directory: %FUNCTIONS_PATH%
echo Port: %PORT%
echo.

REM Check if functions directory exists
if not exist "%FUNCTIONS_PATH%" (
    echo Functions directory not found: %FUNCTIONS_PATH%
    pause
    exit /b 1
)

echo Starting edge runtime server...
echo Press Ctrl+C to stop
echo.
echo Test endpoints:
echo   Health Check: http://localhost:%PORT%/health
echo   List Functions: http://localhost:%PORT%/
echo   Call Function: http://localhost:%PORT%/<function-name>
echo.

REM Run the server
deno run --allow-net --allow-read --allow-env --unstable edge-runtime-server.ts

