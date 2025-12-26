@echo off
REM MailHog Quick Start Script for KarHubty (Windows)

echo.
echo 🚀 Starting KarHubty with MailHog...
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop.
    echo Visit: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Start Docker Compose
echo 📦 Starting Docker containers (MailHog + PostgreSQL)...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 5 /nobreak

REM Check if containers are running
docker ps | find "karhubty-mailhog" >nul
if %errorlevel% equ 0 (
    echo ✅ MailHog is running
    echo    📧 Web UI: http://localhost:8025
    echo    SMTP: localhost:1025
) else (
    echo ❌ MailHog failed to start
    docker-compose logs mailhog
    pause
    exit /b 1
)

docker ps | find "karhubty-postgres" >nul
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL is running
    echo    Database: karhubty
) else (
    echo ❌ PostgreSQL failed to start
    docker-compose logs postgres
    pause
    exit /b 1
)

echo.
echo 🎉 All services are ready!
echo.
echo Next steps:
echo 1. Open another terminal and start the backend:
echo    cd karhubty-backend ^&^& npm start
echo.
echo 2. Open another terminal and start the frontend:
echo    cd karhubty-frontend ^&^& npm start
echo.
echo 3. View emails at: http://localhost:8025
echo.
echo To stop services: docker-compose down
echo.
pause
