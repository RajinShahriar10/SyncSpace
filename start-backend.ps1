#!/usr/bin/env pwsh
# SyncSpace Backend - runs backend + cloudflared tunnel
# Auto-restarts if either process dies

$backendProject = "D:\WDD-2204\SyncSpace\backend\src\SyncSpace.API\SyncSpace.API.csproj"
$logDir = "$env:USERPROFILE\.syncspace"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$env:ConnectionStrings__DefaultConnection = 'Host=ep-bitter-moon-aoefzjzq-pooler.c-2.ap-southeast-1.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=npg_Fg9dJr0RLPkw;SSL Mode=Require'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Jwt__Key = 'YourSuperSecretDevelopmentKeyHereThatIsAtLeast32CharactersLong!!'
$env:Redis__Connection = ''
$env:GitHub__ClientId = 'Ov23liBN7G6tcfLhKrbl'
$env:GitHub__ClientSecret = 'a8273f56742e9c02fadb07200cb590f4efb0459b'

$cloudflaredExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"

while ($true) {
    Write-Host "[$(Get-Date -Format o)] Starting backend..."
    $backend = Start-Process -FilePath "dotnet" -ArgumentList "run --project `"$backendProject`" --urls http://localhost:5000" -PassThru -NoNewWindow -RedirectStandardOutput "$logDir\backend.log" -RedirectStandardError "$logDir\backend-err.log"

    Start-Sleep -Seconds 15

    Write-Host "[$(Get-Date -Format o)] Starting cloudflared tunnel..."
    $tunnel = Start-Process -FilePath $cloudflaredExe -ArgumentList "tunnel --url http://localhost:5000" -PassThru -NoNewWindow -RedirectStandardOutput "$logDir\tunnel.log" -RedirectStandardError "$logDir\tunnel-err.log"

    Start-Sleep -Seconds 10

    # Extract tunnel URL
    $tunnelUrl = ""
    $attempts = 0
    while ($tunnelUrl -eq "" -and $attempts -lt 10) {
        Start-Sleep -Seconds 2
        $match = Select-String -Path "$logDir\tunnel-err.log" -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" -ErrorAction SilentlyContinue
        if ($match) {
            $tunnelUrl = ($match.Matches[0].Value -replace '\x1B\[[0-9;]*m','')
        }
        $attempts++
    }

    if ($tunnelUrl) {
        Write-Host "[$(Get-Date -Format o)] Tunnel URL: $tunnelUrl"
        Set-Content -Path "$logDir\tunnel-url.txt" -Value $tunnelUrl
    }

    # Wait for either process to die
    while (!$backend.HasExited -and !$tunnel.HasExited) {
        Start-Sleep -Seconds 5
    }

    Write-Host "[$(Get-Date -Format o)] Process died. Restarting in 5 seconds..."

    if (!$backend.HasExited) { $backend | Stop-Process -Force }
    if (!$tunnel.HasExited) { $tunnel | Stop-Process -Force }

    Start-Sleep -Seconds 5
}
