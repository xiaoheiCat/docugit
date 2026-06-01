param(
    [Parameter(Mandatory)]
    [ValidateSet('x64', 'arm64')]
    [string]$Arch,

    [Parameter(Mandatory)]
    [string]$Binary,

    [Parameter(Mandatory)]
    [string]$Version,

    [Parameter(Mandatory)]
    [string]$OutMsi
)

$ErrorActionPreference = 'Stop'

function Get-WixBinDir {
    $candle = Join-Path ${env:ProgramFiles(x86)} 'WiX Toolset v3.14\bin\candle.exe'
    if (-not (Test-Path $candle)) {
        throw "WiX Toolset 3.14 not found. Install it before running build-msi.ps1."
    }
    return Split-Path $candle -Parent
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$binaryPath = (Resolve-Path $Binary).Path
$outDir = Split-Path $OutMsi -Parent
if ($outDir -and -not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$wixBin = Get-WixBinDir
$env:Path = "$wixBin;$env:Path"

$workDir = Join-Path $env:RUNNER_TEMP "docugit-msi-$Arch"
if (-not $workDir) {
    $workDir = Join-Path ([System.IO.Path]::GetTempPath()) "docugit-msi-$Arch"
}
New-Item -ItemType Directory -Force -Path $workDir | Out-Null

$msiVersion = $Version.Replace('_', '.')
$templatePath = Join-Path $repoRoot 'packaging/msi/docugit.wxs.template'
$wxsPath = Join-Path $workDir 'docugit.wxs'
$uiWxsPath = Join-Path $repoRoot 'packaging/msi/wixui/WixUI_DocuGit.wxs'

$wxs = (Get-Content $templatePath -Raw).Replace('@VERSION@', $msiVersion).Replace('@BINARY@', $binaryPath)
Set-Content -Path $wxsPath -Value $wxs -Encoding UTF8

& candle.exe -arch $Arch -ext WixUIExtension -out "$workDir\" $wxsPath $uiWxsPath
& light.exe -ext WixUIExtension -cultures:en-us -out $OutMsi `
    (Join-Path $workDir 'docugit.wixobj') `
    (Join-Path $workDir 'WixUI_DocuGit.wixobj')

Write-Host "Built MSI: $OutMsi"
