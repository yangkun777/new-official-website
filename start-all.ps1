# DEGSON 新官网 · 一键启动（MySQL 3307 → Directus 8055 → 前台 3000）
#
#   .\start-all.ps1              生产模式启动（必要时先 build）
#   .\start-all.ps1 -Dev         前台用 dev 模式（改后台立即反映）
#   .\start-all.ps1 -SkipBuild   强制复用已有 .next，不重新构建
#
# 幂等：已在监听的端口会跳过，不会重复起进程。

param(
    [switch]$Dev,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Continue"
$ROOT = "D:\degson-pilot"
$NPM = "C:\Users\admin\AppData\Roaming\npm"
$NODE = "C:\nvm\v22.23.2"
$MYSQL_PWD = "degson_dev_2026"

# 本机只有 Windows PowerShell 5.1（无 PowerShell 7），但脚本在两种 host 下都要能跑
$SHELL = $null
foreach ($cand in @(
        (Get-Command pwsh -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
        "C:\Program Files\PowerShell\7\pwsh.exe",
        (Get-Command powershell -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue)
    )) {
    if ($cand -and (Test-Path $cand)) { $SHELL = $cand; break }
}
if (-not $SHELL) {
    Write-Host "找不到可用的 PowerShell 解释器" -ForegroundColor Red
    exit 1
}

function Test-Port([int]$Port) {
    return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

function Wait-Port([int]$Port, [string]$Name, [int]$TimeoutSec = 90) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-Port $Port) { return $true }
        Start-Sleep -Milliseconds 700
    }
    Write-Host "  ✗ $Name 在 $TimeoutSec 秒内未监听 $Port" -ForegroundColor Red
    return $false
}

# PATH 顺序很关键：全局 npm 目录必须排在 Node 22 目录之前，
# 否则会命中 C:\nvm\v22.23.2\...\pnpm.cjs（DLP 密文，Node 读出来是乱码）
$env:PATH = "$NPM;$NODE;" + $env:PATH

Write-Host "`n=== DEGSON 新官网启动 ===`n" -ForegroundColor Cyan

# ---------- ① MySQL 3307 ----------
Write-Host "[1/3] MySQL 3307"
if (Test-Port 3307) {
    Write-Host "  = 已在运行，跳过" -ForegroundColor DarkGray
} else {
    $mysqld = Join-Path $ROOT "mysql\bin\mysqld.exe"
    $myini = Join-Path $ROOT "config\mysql\my.ini"
    if (-not (Test-Path $mysqld)) {
        Write-Host "  ✗ 找不到 $mysqld" -ForegroundColor Red
        Write-Host "    便携版 MySQL 不入库（约 1GB），需另行解压到 $ROOT\mysql" -ForegroundColor Yellow
        exit 1
    }
    if (-not (Test-Path $myini)) {
        Write-Host "  ✗ 找不到配置文件 $myini（该文件应在 git 里）" -ForegroundColor Red
        exit 1
    }
    # MySQL 不会自动创建 log-error 所在目录
    New-Item -ItemType Directory -Force -Path (Join-Path $ROOT "logs") | Out-Null
    Start-Process -FilePath $mysqld `
        -ArgumentList "--defaults-file=`"$myini`"" `
        -WindowStyle Hidden
    if (-not (Wait-Port 3307 "MySQL" 90)) {
        Write-Host "  错误日志: $ROOT\logs\mysqld.err" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  ✓ 已启动" -ForegroundColor Green
}

# ---------- ② Directus 8055 ----------
Write-Host "[2/3] Directus 11 (8055)"
if (Test-Port 8055) {
    Write-Host "  = 已在运行，跳过" -ForegroundColor DarkGray
} else {
    # 用独立窗口跑，方便看日志；关掉该窗口即停服务
    $cmd = "`$env:PATH='$NPM;$NODE;'+`$env:PATH; Set-Location '$ROOT\cms'; " +
           "Write-Host 'Directus 11 — http://localhost:8055/admin' -ForegroundColor Cyan; " +
           ".\node_modules\.bin\directus.CMD start"
    Start-Process -FilePath $SHELL -ArgumentList "-NoExit", "-Command", $cmd -WindowStyle Minimized
    if (-not (Wait-Port 8055 "Directus" 120)) { exit 1 }
    # 等它真正能应答，而不是仅仅监听
    $deadline = (Get-Date).AddSeconds(60)
    $pong = $false
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:8055/server/ping" -UseBasicParsing -TimeoutSec 5
            if ($r.Content -match "pong") { $pong = $true; break }
        } catch { }
        Start-Sleep -Milliseconds 800
    }
    if ($pong) { Write-Host "  ✓ 已启动 (ping = pong)" -ForegroundColor Green }
    else { Write-Host "  ⚠ 端口已监听但 /server/ping 未返回 pong，请查看该窗口日志" -ForegroundColor Yellow }
}

# ---------- ③ 前台 3000 ----------
Write-Host "[3/3] Next 前台 (3000)"
if (Test-Port 3000) {
    Write-Host "  = 已在运行，跳过" -ForegroundColor DarkGray
} else {
    $web = Join-Path $ROOT "web"

    # 凭据检查：删库重建后必须重跑 make_web_token.mjs，否则全站 401
    $envFile = Join-Path $web ".env.local"
    if (-not (Test-Path $envFile)) {
        Write-Host "  ✗ 缺 web\.env.local（前台只读凭据）" -ForegroundColor Red
        Write-Host "    先跑: cd $ROOT\data; node make_web_token.mjs" -ForegroundColor Yellow
        exit 1
    }

    if ($Dev) {
        $cmd = "`$env:PATH='$NPM;$NODE;'+`$env:PATH; Set-Location '$web'; " +
               "Write-Host 'Next dev — http://localhost:3000' -ForegroundColor Cyan; " +
               "pnpm dev"
    } else {
        $needsBuild = $SkipBuild -eq $false -and -not (Test-Path (Join-Path $web ".next\BUILD_ID"))
        if ($needsBuild) {
            Write-Host "  … 首次启动，先构建（约 1 分钟）" -ForegroundColor DarkGray
            Push-Location $web
            & ".\node_modules\.bin\next.CMD" build
            $buildExit = $LASTEXITCODE
            Pop-Location
            if ($buildExit -ne 0) {
                Write-Host "  ✗ 构建失败，请看上面的输出" -ForegroundColor Red
                exit 1
            }
        }
        $cmd = "`$env:PATH='$NPM;$NODE;'+`$env:PATH; Set-Location '$web'; " +
               "Write-Host 'Next 前台 — http://localhost:3000' -ForegroundColor Cyan; " +
               ".\node_modules\.bin\next.CMD start -p 3000"
    }
    Start-Process -FilePath $SHELL -ArgumentList "-NoExit", "-Command", $cmd -WindowStyle Minimized
    if (-not (Wait-Port 3000 "前台" 120)) { exit 1 }
    Write-Host "  ✓ 已启动" -ForegroundColor Green
}

# ---------- 汇总 ----------
Write-Host "`n=== 服务状态 ===" -ForegroundColor Cyan
foreach ($p in @(@(3307, "MySQL"), @(8055, "Directus"), @(3000, "前台 Next"))) {
    $ok = Test-Port $p[0]
    $mark = if ($ok) { "✓" } else { "✗" }
    $color = if ($ok) { "Green" } else { "Red" }
    Write-Host ("  {0} {1,-14} {2}" -f $mark, $p[1], $p[0]) -ForegroundColor $color
}

Write-Host "`n  前台      http://localhost:3000  (根路径 307 → /en)" -ForegroundColor White
Write-Host "  英文站    http://localhost:3000/en" -ForegroundColor White
Write-Host "  中文站    http://localhost:3000/zh" -ForegroundColor White
Write-Host "  后台      http://localhost:8055/admin" -ForegroundColor White

Write-Host "`n  端到端验收: cd $ROOT\data; node verify_m1_web.mjs" -ForegroundColor DarkGray
Write-Host "  （期望 PASS 34 / FAIL 0）`n" -ForegroundColor DarkGray
