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

function ConvertTo-MsiProductVersion {
    param([string]$PkgVersion)

    # PKG_VERSION: 2026.06.01_11.14.29_3d6a44 -> MSI: 2026.6.1.15722
    if ($PkgVersion -notmatch '^(\d+)\.(\d+)\.(\d+)_(\d+)\.(\d+)\.(\d+)_([0-9a-f]+)$') {
        throw "unsupported PKG_VERSION format for MSI: $PkgVersion"
    }

    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    $build = [int]$Matches[3]
    $revision = [Convert]::ToInt32($Matches[7].Substring(0, [Math]::Min(4, $Matches[7].Length)), 16) % 65534
    return "$major.$minor.$build.$revision"
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory)]
        [string]$Label,
        [Parameter(Mandatory)]
        [scriptblock]$Command
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

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

$msiVersion = ConvertTo-MsiProductVersion $Version
$templatePath = Join-Path $repoRoot 'packaging/msi/docugit.wxs.template'
$wxsPath = Join-Path $workDir 'docugit.wxs'
$uiWxsPath = Join-Path $repoRoot 'packaging/msi/wixui/WixUI_DocuGit.wxs'

$wxs = (Get-Content $templatePath -Raw).Replace('@VERSION@', $msiVersion).Replace('@BINARY@', $binaryPath)
Set-Content -Path $wxsPath -Value $wxs -Encoding UTF8

Invoke-Checked 'candle' {
    candle.exe -arch $Arch -ext WixUIExtension -out "$workDir\" $wxsPath $uiWxsPath
}
Invoke-Checked 'light' {
    light.exe -ext WixUIExtension -cultures:en-us -out $OutMsi `
        (Join-Path $workDir 'docugit.wixobj') `
        (Join-Path $workDir 'WixUI_DocuGit.wixobj')
}

Write-Host "Built MSI: $OutMsi"
