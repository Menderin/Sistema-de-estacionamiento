@echo off
:: Ir a la carpeta raiz del proyecto
cd /d "%~dp0"

echo === ACTUALIZANDO CARPETA WWW ===

:: 1. Limpiar y recrear www
if exist www rd /s /q www
mkdir www

:: 2. Copiar carpetas completas
xcopy assets www\assets\ /E /I /H /Y /Q
xcopy pages www\pages\ /E /I /H /Y /Q
xcopy scripts www\scripts\ /E /I /H /Y /Q

:: 3. Copiar archivos sueltos de la raiz
copy index.html www\ /Y
copy login.js www\ /Y
copy sectores.js www\ /Y

echo === SINCRONIZANDO CON ANDROID ===

:: 4. Ejecutar comando de Capacitor
call npx cap copy android

echo.
echo PROCESO COMPLETADO EXITOSAMENTE
pause