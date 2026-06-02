param(
    [string]$PngPath = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')) 'assets/icon.png'),
    [string]$IcoPath = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')) 'assets/icon.ico')
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $PngPath)) {
    throw "fatal: missing icon source: $PngPath"
}

Add-Type -AssemblyName System.Drawing

$source = [System.Drawing.Bitmap]::FromFile($PngPath)
try {
    $size = 256
    $resized = New-Object System.Drawing.Bitmap $size, $size
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($resized)
        try {
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($source, 0, 0, $size, $size)
        } finally {
            $graphics.Dispose()
        }

        $iconHandle = $resized.GetHicon()
        try {
            $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
            $stream = [System.IO.File]::Open($IcoPath, [System.IO.FileMode]::Create)
            try {
                $icon.Save($stream)
            } finally {
                $stream.Close()
            }
        } finally {
            [void][System.Drawing.Icon]::DestroyIcon($iconHandle)
        }
    } finally {
        $resized.Dispose()
    }
} finally {
    $source.Dispose()
}

Write-Host "Prepared Windows executable icon: $IcoPath"
