# ENDLESS BELOW — placeholder asset generator
#
# PURPOSE
#   Generates the few *binary* placeholder assets the site needs in order to be
#   testable before real artwork exists:
#     - 16x16 pixel-art class sprites            assets/characters/<class>/sprite.png
#     - 4-frame 64x16 idle spritesheets          assets/characters/<class>/idle-side-sheet.png
#     - favicons (32 / 180 / 512)                assets/branding/
#     - OpenGraph image                          assets/media/og-image.png
#
#   Every file produced by this script is PLACEHOLDER ART. Delete and replace
#   with real assets (see ASSET_GUIDE.md). All large placeholders (key art,
#   biome art, screenshots) are drawn in CSS instead and need no files.
#
# USAGE
#   pwsh -File tools/generate-placeholders.ps1       (run from the repo root)

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot

# --- class list + accent colour (kept in sync with data/classes.js) -----------
$classes = [ordered]@{
    archer     = '#8fb37a'
    warrior    = '#b4703a'
    bard       = '#c8a24a'
    priest     = '#e6dcc6'
    mage       = '#6f5fb8'
    rogue      = '#5f6a7a'
    paladin    = '#cdb98a'
    barbarian  = '#9d4a3a'
    warlock    = '#8a4f9e'
    spellblade = '#6fb3c0'
}

# --- 16x16 humanoid silhouette ------------------------------------------------
# . = transparent   K = outline   S = skin/parchment   C = cloth   A = class accent
$sprite = @(
    '................',
    '......KKKK......',
    '.....KSSSSK.....',
    '.....KSSSSK.....',
    '.....KSSSSK.....',
    '......KSSK......',
    '....KKCCCCKK....',
    '...KACCCCCCAK...',
    '...KACCCCCCAK...',
    '....KCCCCCCK....',
    '.....KCCCCK.....',
    '.....KCCCCK.....',
    '.....KC..CK.....',
    '.....KC..CK.....',
    '....KKK..KKK....',
    '................'
)

function Get-Palette([string]$accentHex) {
    $accent = [System.Drawing.ColorTranslator]::FromHtml($accentHex)
    return @{
        'K' = [System.Drawing.Color]::FromArgb(255, 10, 11, 13)
        'S' = [System.Drawing.Color]::FromArgb(255, 205, 192, 164)
        'C' = [System.Drawing.Color]::FromArgb(255, 42, 45, 51)
        'A' = [System.Drawing.Color]::FromArgb(255, $accent.R, $accent.G, $accent.B)
    }
}

function Write-Sprite([System.Drawing.Bitmap]$bmp, [int]$originX, [int]$offsetY, $palette) {
    for ($y = 0; $y -lt 16; $y++) {
        $row = $sprite[$y]
        for ($x = 0; $x -lt 16; $x++) {
            $key = $row[$x]
            if ($key -eq '.') { continue }
            $ty = $y + $offsetY
            if ($ty -lt 0 -or $ty -gt 15) { continue }
            $bmp.SetPixel($originX + $x, $ty, $palette[[string]$key])
        }
    }
}

foreach ($id in $classes.Keys) {
    $palette = Get-Palette $classes[$id]
    $dir = Join-Path $root "assets/characters/$id"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null

    # static 16x16 sprite
    $bmp = New-Object System.Drawing.Bitmap 16, 16, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    Write-Sprite $bmp 0 0 $palette
    $bmp.Save((Join-Path $dir 'sprite.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    # 4-frame idle spritesheet, horizontal, 16x16 per frame, 1px bob
    $offsets = @(0, 1, 0, -1)
    $sheet = New-Object System.Drawing.Bitmap 64, 16, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for ($f = 0; $f -lt 4; $f++) {
        Write-Sprite $sheet ($f * 16) $offsets[$f] $palette
    }
    $sheet.Save((Join-Path $dir 'idle-side-sheet.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    $sheet.Dispose()

    Write-Host "sprite + idle sheet -> assets/characters/$id/"
}

# --- favicon / app icon -------------------------------------------------------
function New-Icon([int]$size, [string]$path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#0a0b0d'))
    $g.FillRectangle($bg, 0, 0, $size, $size)

    $u = $size / 16.0
    $ring = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#6f5fb8')), ($u * 0.6)
    $g.DrawEllipse($ring, ($u * 1.6), ($u * 1.6), ($size - $u * 3.2), ($size - $u * 3.2))

    # three descending chevrons = "below"
    $chev = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#cdc0a4')), ($u * 0.9)
    $chev.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $chev.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    for ($i = 0; $i -lt 3; $i++) {
        $top = $u * (4.2 + $i * 2.6)
        $g.DrawLines($chev, @(
            (New-Object System.Drawing.PointF(($u * 5.0), $top)),
            (New-Object System.Drawing.PointF(($u * 8.0), ($top + $u * 1.8))),
            (New-Object System.Drawing.PointF(($u * 11.0), $top))
        ))
    }

    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "icon -> $path"
}

$branding = Join-Path $root 'assets/branding'
New-Item -ItemType Directory -Force -Path $branding | Out-Null
New-Icon 512 (Join-Path $branding 'favicon-512.png')
New-Icon 180 (Join-Path $branding 'apple-touch-icon-180.png')
New-Icon 32 (Join-Path $branding 'favicon-32.png')

# --- OpenGraph placeholder ----------------------------------------------------
$mediaDir = Join-Path $root 'assets/media'
New-Item -ItemType Directory -Force -Path $mediaDir | Out-Null

$og = New-Object System.Drawing.Bitmap 1200, 630, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($og)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 0, 0),
    (New-Object System.Drawing.Point 0, 630),
    [System.Drawing.ColorTranslator]::FromHtml('#121419'),
    [System.Drawing.ColorTranslator]::FromHtml('#050506'))
$g.FillRectangle($grad, 0, 0, 1200, 630)

$frame = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#3a3e46')), 2
$g.DrawRectangle($frame, 40, 40, 1120, 550)

$titleFont = New-Object System.Drawing.Font 'Georgia', 72, ([System.Drawing.FontStyle]::Regular)
$subFont = New-Object System.Drawing.Font 'Georgia', 24, ([System.Drawing.FontStyle]::Regular)
$noteFont = New-Object System.Drawing.Font 'Consolas', 18, ([System.Drawing.FontStyle]::Regular)
$parchment = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#e6dcc6'))
$muted = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#9a8f78'))
$accent = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#6fb3c0'))

$center = New-Object System.Drawing.StringFormat
$center.Alignment = [System.Drawing.StringAlignment]::Center

$g.DrawString('ENDLESS BELOW', $titleFont, $parchment, (New-Object System.Drawing.RectangleF 0, 210, 1200, 120), $center)
$g.DrawString('DESCEND.  SURVIVE.  RETURN CHANGED.', $subFont, $muted, (New-Object System.Drawing.RectangleF 0, 330, 1200, 60), $center)
$g.DrawString('PLACEHOLDER OPENGRAPH IMAGE  /  1200 x 630', $noteFont, $accent, (New-Object System.Drawing.RectangleF 0, 500, 1200, 40), $center)

$g.Dispose()
$og.Save((Join-Path $mediaDir 'og-image.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$og.Dispose()
Write-Host 'opengraph -> assets/media/og-image.png'

Write-Host ''
Write-Host 'Done. All generated files are PLACEHOLDERS - see ASSET_GUIDE.md.'
