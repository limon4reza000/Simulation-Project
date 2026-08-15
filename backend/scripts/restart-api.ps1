# Restarts the dev API on Windows.
#
# `pkill -f "tsx src/server.ts"` from git-bash does NOT reliably kill these
# processes: tsx spawns a child that survives, keeps port 4000, and the "new"
# server silently fails to bind. The result is a server running older code,
# which looks exactly like a routing bug. Use this instead.
param([int]$Port = 4000)

Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*server.ts*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 2

if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
  Write-Error "Port $Port is still held after killing server processes."
  exit 1
}
Write-Output "Port $Port free; start the API with: npm run dev"
