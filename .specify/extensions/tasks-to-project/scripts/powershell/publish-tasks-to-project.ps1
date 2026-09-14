# publish-tasks-to-project.ps1
#
# PowerShell wrapper around the Python implementation that publishes a Spec
# Kit tasks.md to a GitHub Project (v2) kanban board.
#
# Usage:
#   .\publish-tasks-to-project.ps1 [tasks_md_path] [-DryRun]

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string] $TasksMdPath,

    [switch] $DryRun
)

$ErrorActionPreference = "Stop"

$projectRoot = (Get-Location).Path
$extDir      = Join-Path $projectRoot ".specify/extensions/tasks-to-project"
$pyScript    = Join-Path $extDir "scripts/python/publish_tasks_to_project.py"

if (-not (Test-Path -LiteralPath $pyScript)) {
    Write-Error "tasks-to-project: python script not found at $pyScript"
    exit 1
}

$pythonExe = $null
foreach ($candidate in @("python3", "python")) {
    $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($null -ne $cmd) {
        $versionOutput = & $candidate --version 2>&1
        if ($versionOutput -match "^Python 3") {
            $pythonExe = $cmd.Source
            break
        }
    }
}

if (-not $pythonExe) {
    Write-Error "tasks-to-project: Python 3 not found on PATH; cannot publish."
    exit 1
}

$argList = @($pyScript, "publish")
if ($TasksMdPath) { $argList += $TasksMdPath }
if ($DryRun)      { $argList += "--dry-run" }

& $pythonExe @argList
exit $LASTEXITCODE
