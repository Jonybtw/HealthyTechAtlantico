$ErrorActionPreference = "Stop"
$projectName = "HealthyTechAtlantico"
$zipName = "$projectName-Final.zip"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$destinationPath = Join-Path $desktopPath $zipName

Write-Host "A preparar a entrega do projeto $projectName..." -ForegroundColor Cyan
Write-Host "Isto pode demorar alguns segundos." -ForegroundColor Gray

# Define exclusions (relative to project root)
$excludeList = @(
    "node_modules",
    ".next",
    ".git",
    ".env*",
    "criar-entrega.ps1",
    ".DS_Store",
    "*.zip",
    "*.rar"
)

$sourcePath = $PSScriptRoot

# Remove existing zip if any
if (Test-Path $destinationPath) {
    Remove-Item $destinationPath -Force
}

# Create a temporary directory to assemble files
$tempPath = Join-Path ([System.IO.Path]::GetTempPath()) "HealthyTechAtlantico_Temp"
if (Test-Path $tempPath) { Remove-Item -Recurse -Force $tempPath }
New-Item -ItemType Directory -Path $tempPath | Out-Null

Write-Host "A copiar ficheiros (ignorando node_modules, .next, .git e credenciais)..."
# We use robocopy for fast copying with exclusions
$excludeArgs = $excludeList | ForEach-Object { $_ }
$robocopyArgs = @($sourcePath, $tempPath, "/E", "/XD", "node_modules", ".next", ".git", "/XF", ".env*", "criar-entrega.ps1", "*.zip", "*.rar", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP")
& robocopy $robocopyArgs | Out-Null

# Create the ZIP
Write-Host "A comprimir ficheiros para $zipName..."
Compress-Archive -Path "$tempPath\*" -DestinationPath $destinationPath -Force

# Clean up
Remove-Item -Recurse -Force $tempPath

Write-Host "`nEntrega preparada com sucesso!" -ForegroundColor Green
Write-Host "O ficheiro final encontra-se no teu Ambiente de Trabalho:" -ForegroundColor White
Write-Host "-> $destinationPath" -ForegroundColor Yellow
Write-Host "`nPodes enviar este ficheiro .zip para a empresa. Boa sorte na apresentação!" -ForegroundColor Cyan
