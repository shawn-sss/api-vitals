@echo off
cd /d "%~dp0"

echo Starting Spring Boot app...
echo.
call mvnw.cmd spring-boot:run

echo.
echo App stopped.
pause
