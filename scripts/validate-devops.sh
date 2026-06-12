#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKIP_BUILD="${SKIP_BUILD:-false}"

has_command() {
  command -v "$1" >/dev/null 2>&1
}

step() {
  echo
  echo "==> $1"
}

echo "GMAO DevOps validation"
echo "Root: ${ROOT}"

step "Tool availability"
for tool in git java mvn node npm python docker kubectl helm; do
  if has_command "${tool}"; then
    echo "OK   ${tool}"
  else
    echo "SKIP ${tool} not found in PATH"
  fi
done

if [ "${SKIP_BUILD}" != "true" ]; then
  step "Backend Maven compile"
  (cd "${ROOT}/backend" && mvn -B -ntp -DskipTests compile)

  step "Frontend build"
  (cd "${ROOT}/frontend" && npm ci && npm run build)

  step "AI service Python compile"
  (cd "${ROOT}/ai-service" && python -m compileall app)
fi

if has_command docker; then
  step "Docker Compose config"
  (cd "${ROOT}" && docker compose config)
else
  echo "SKIP Docker Compose validation because docker is not available."
fi

if has_command helm; then
  step "Helm lint and template"
  (cd "${ROOT}" && helm lint helm/gmao && helm template gmao helm/gmao --namespace gmao --values helm/gmao/values-dev.yaml >/dev/null)
else
  echo "SKIP Helm validation because helm is not available."
fi

if has_command kubectl; then
  step "Kubernetes kustomize render"
  (cd "${ROOT}" && kubectl kustomize k8s >/dev/null)
else
  echo "SKIP Kubernetes render because kubectl is not available."
fi

echo
echo "Validation finished."
