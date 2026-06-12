param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Test-CommandAvailable {
    param([Parameter(Mandatory = $true)][string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan
    & $Command
}

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
    }
}

Write-Host "GMAO DevOps validation" -ForegroundColor Green
Write-Host "Root: $Root"

Invoke-Step "Tool availability" {
    foreach ($tool in @("git", "java", "mvn", "node", "npm", "python", "docker", "kubectl", "helm")) {
        if (Test-CommandAvailable $tool) {
            Write-Host "OK   $tool"
        } else {
            Write-Host "SKIP $tool not found in PATH" -ForegroundColor Yellow
        }
    }
}

if (-not $SkipBuild) {
    Invoke-Step "Backend Maven compile" {
        Push-Location "$Root\backend"
        try {
            Invoke-Native mvn -B -ntp -DskipTests compile
        } finally {
            Pop-Location
        }
    }

    Invoke-Step "Frontend build" {
        $tempFrontend = Join-Path ([System.IO.Path]::GetTempPath()) ("gmao-frontend-build-" + [guid]::NewGuid())
        New-Item -ItemType Directory -Path $tempFrontend | Out-Null
        try {
            Get-ChildItem "$Root\frontend" -Force |
                Where-Object { $_.Name -notin @("node_modules", "dist", ".vite") } |
                Copy-Item -Destination $tempFrontend -Recurse -Force

            Push-Location $tempFrontend
            Invoke-Native npm ci
            Invoke-Native npm run build
        } finally {
            if ((Get-Location).Path -eq $tempFrontend) {
                Pop-Location
            }
            Remove-Item -LiteralPath $tempFrontend -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    Invoke-Step "AI service Python compile" {
        Push-Location "$Root\ai-service"
        try {
            Invoke-Native python -m compileall app
        } finally {
            Pop-Location
        }
    }
}

if (Test-CommandAvailable docker) {
    Invoke-Step "Docker Compose config" {
        Push-Location $Root
        try {
            Invoke-Native docker compose config
        } finally {
            Pop-Location
        }
    }
} else {
    Write-Host "SKIP Docker Compose validation because docker is not available." -ForegroundColor Yellow
}

if (Test-CommandAvailable helm) {
    Invoke-Step "Helm lint and template" {
        Push-Location $Root
        try {
            Invoke-Native helm lint helm/gmao
            $rendered = helm template gmao helm/gmao --namespace gmao --values helm/gmao/values-dev.yaml
            if ($LASTEXITCODE -ne 0) {
                throw "Command failed with exit code ${LASTEXITCODE}: helm template gmao helm/gmao --namespace gmao --values helm/gmao/values-dev.yaml"
            }
            if (-not $rendered) {
                throw "Helm template returned an empty manifest."
            }
        } finally {
            Pop-Location
        }
    }
} else {
    Write-Host "SKIP Helm validation because helm is not available." -ForegroundColor Yellow
}

if (Test-CommandAvailable kubectl) {
    Invoke-Step "Kubernetes kustomize render" {
        Push-Location $Root
        try {
            $rendered = kubectl kustomize k8s
            if ($LASTEXITCODE -ne 0) {
                throw "Command failed with exit code ${LASTEXITCODE}: kubectl kustomize k8s"
            }
            if (-not $rendered) {
                throw "kubectl kustomize returned an empty manifest."
            }
        } finally {
            Pop-Location
        }
    }
} else {
    Write-Host "SKIP Kubernetes render because kubectl is not available." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Validation finished." -ForegroundColor Green
