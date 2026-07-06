@echo off
:: Ir a la carpeta raiz del proyecto
cd /d "%~dp0"

echo === ACTUALIZANDO CARPETA DIST ===

:: 1. Limpiar y recrear dist
if exist dist rd /s /q dist
mkdir dist

:: 2. Copiar carpetas completas
xcopy assets dist\assets\ /E /I /H /Y /Q
xcopy pages dist\pages\ /E /I /H /Y /Q
xcopy scripts dist\scripts\ /E /I /H /Y /Q

:: 3. Copiar archivos sueltos de la raiz
copy index.html dist\ /Y
copy login.js dist\ /Y
copy sectores.js dist\ /Y

echo === SINCRONIZANDO CON ANDROID ===

:: 4. Ejecutar comando de Capacitor
call npx cap copy android

echo.
echo PROCESO COMPLETADO EXITOSAMENTE
pause