param(
    [string]$PngPath = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')) 'assets/icon.png'),
    [string]$IcoPath = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')) 'assets/icon.ico')
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $PngPath)) {
    throw "fatal: missing icon source: $PngPath"
}

Add-Type -AssemblyName System.Drawing
if (-not ('WinIcon' -as [type])) {
    Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class WinIcon {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool DestroyIcon(IntPtr hIcon);
}
"@
}

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
            $fileIcon = [System.Drawing.Icon]::new($icon, $size, $size)
            try {
                $stream = [System.IO.File]::Open($IcoPath, [System.IO.FileMode]::Create)
                try {
                    $fileIcon.Save($stream)
                } finally {
                    $stream.Close()
                }
            } finally {
                $fileIcon.Dispose()
            }
        } finally {
            [void][WinIcon]::DestroyIcon($iconHandle)
        }
    } finally {
        $resized.Dispose()
    }
} finally {
    $source.Dispose()
}

Write-Host "Prepared Windows executable icon: $IcoPath"
