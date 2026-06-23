$ErrorActionPreference = "Stop"
$projectName = "HealthyTechAtlantico"
$zipName = "$projectName-Final.zip"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$destinationPath = Join-Path $desktopPath $zipName

Write-Host "A preparar a entrega do projeto $projectName..." -ForegroundColor Cyan
Write-Host "Isto pode demorar alguns segundos." -ForegroundColor Gray

$sourceRoot = $PSScriptRoot

# Remove existing zip if any
if (Test-Path $destinationPath) {
    Remove-Item $destinationPath -Force
    Write-Host "ZIP anterior removido." -ForegroundColor Gray
}

# Create a temporary directory to assemble files
$tempPath = Join-Path ([System.IO.Path]::GetTempPath()) "HealthyTechAtlantico_Temp"
if (Test-Path $tempPath) { Remove-Item -Recurse -Force $tempPath }
New-Item -ItemType Directory -Path $tempPath | Out-Null

Write-Host "A copiar 'next/' (ignorando node_modules, .next, .git e credenciais)..."
$tempNext = Join-Path $tempPath "next"
New-Item -ItemType Directory -Path $tempNext | Out-Null
& robocopy "$sourceRoot\next" $tempNext /E `
    /XD "node_modules" ".next" ".git" ".claude" ".trae" ".playwright-mcp" ".uploads" `
    /XF ".env" ".env.local" "*.zip" "*.rar" "criar-entrega.ps1" `
    /NDL /NJH /NJS /NC /NS /NP | Out-Null

Write-Host "A copiar 'docs/' (manuais e RGPD)..."
$tempDocs = Join-Path $tempPath "docs"
New-Item -ItemType Directory -Path $tempDocs | Out-Null
& robocopy "$sourceRoot\docs" $tempDocs /E /NDL /NJH /NJS /NC /NS /NP | Out-Null

Write-Host "A copiar ficheiros da raiz (.gitignore, README, etc.)..."
$rootFiles = @(".gitignore", ".gitattributes", "README.md", "package.json")
foreach ($file in $rootFiles) {
    $src = Join-Path $sourceRoot $file
    if (Test-Path $src) {
        Copy-Item $src $tempPath
    }
}

# Create the ZIP
Write-Host "A comprimir ficheiros para $zipName..."
Compress-Archive -Path "$tempPath\*" -DestinationPath $destinationPath -Force

# Clean up
Remove-Item -Recurse -Force $tempPath

$zipSize = [Math]::Round((Get-Item $destinationPath).Length / 1MB, 1)

Write-Host "`nEntrega preparada com sucesso!" -ForegroundColor Green
Write-Host "O ficheiro final encontra-se no teu Ambiente de Trabalho:" -ForegroundColor White
Write-Host "-> $destinationPath ($zipSize MB)" -ForegroundColor Yellow
Write-Host "`nConteudo do ZIP:" -ForegroundColor White
Write-Host "  next/     -> Codigo-fonte da aplicacao (sem node_modules e sem .env)" -ForegroundColor Gray
Write-Host "  docs/     -> Manual Tecnico, Manual de Utilizador e RGPD" -ForegroundColor Gray
Write-Host "`nPodes enviar este ficheiro .zip para a empresa. Boa sorte!" -ForegroundColor Cyan
