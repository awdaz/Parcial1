# Reinicia el entorno de FashionStore con datos semilla limpios.
# Borra el volumen de datos (reservas, usuarios y productos creados en pruebas)
# y vuelve a levantar db + backend + frontend re-ejecutando 01/02 SQL.
#
# Uso:  powershell -ExecutionPolicy Bypass -File .\reset-db.ps1

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

Write-Host "Deteniendo contenedores y borrando volumen de datos..." -ForegroundColor Cyan
docker compose down -v

Write-Host "Reconstruyendo y levantando el stack..." -ForegroundColor Cyan
docker compose up -d --build

Write-Host "Esperando a que los servicios levanten..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

Write-Host "Estado del stack:" -ForegroundColor Green
docker compose ps

Write-Host ""
Write-Host "Listo. Frontend: http://localhost  |  API docs: http://localhost:8000/docs" -ForegroundColor Green
