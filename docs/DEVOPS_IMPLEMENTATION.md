# DevOps Implementation Notes - GMAO

Date: 2026-06-12

## Implemented

- Git initialized locally on branch `devops/cloud-native`.
- Git remote configured: `https://github.com/omardoctype/gmao.git`.
- Root `.gitignore` added to protect secrets, logs, build outputs and local runtime data.
- Root `.env.example` added with placeholders only.
- Backend Dockerfile aligned with Java 21.
- Frontend Dockerfile converted to production-style Nginx static serving.
- AI Service Dockerfile hardened and kept compatible with volume-mounted `documents` and `chroma_db`.
- Docker Compose updated with:
  - MySQL.
  - Backend.
  - Frontend.
  - AI Service.
  - Prometheus.
  - Grafana.
  - Optional Ollama container profile.
- Backend monitoring added through Spring Boot Actuator and Micrometer Prometheus.
- AI Service `/metrics` endpoint added through `prometheus-client`.
- Prometheus and Grafana local configuration added under `monitoring/`.
- GitHub Actions workflow replaced by `.github/workflows/ci-cd.yml`.
- Kubernetes structured manifests added under domain folders in `k8s/`.
- Helm chart extended with dev/prod values, notes, helpers and monitoring templates.
- Local validation scripts added under `scripts/`.

## Local validation limits

The following tools were not available in the local PATH during implementation:

- Docker.
- kubectl.
- Helm.

Therefore, Docker image builds, Docker Compose runtime tests, Kubernetes apply and Helm install were not executed locally.

The validation scripts intentionally report these checks as skipped when tools are missing.

## Ollama strategy

Default Docker Compose mode:

- Ollama runs on the Windows host.
- AI Service uses `http://host.docker.internal:11434`.

Optional Docker mode:

- Start with `docker compose --profile ollama-container up --build`.
- Pull model with `docker compose --profile ollama-container exec ollama ollama pull qwen2.5:1.5b`.

Kubernetes mode:

- Use service DNS `http://ollama:11434` if Ollama runs in-cluster.
- Use an externally reachable URL if Ollama runs on a dedicated VM.

## Security notes

- `.env` is ignored and must not be committed.
- Kubernetes real secrets must not be committed.
- `.env.example`, `.env.production.example`, `k8s/secrets/secrets.example.yaml` and Helm values use placeholders only.
- MySQL, Ollama and AI Service remain internal in Kubernetes.
- Public exposure should go through Ingress or reverse proxy with HTTPS.

## Commands

Validate what is available on Windows:

```powershell
.\scripts\validate-devops.ps1
```

Validate what is available on Linux/macOS:

```bash
bash scripts/validate-devops.sh
```

Docker Compose:

```bash
docker compose up --build
```

Kubernetes:

```bash
kubectl apply -k k8s
```

Helm:

```bash
helm install gmao ./helm/gmao -n gmao --create-namespace -f helm/gmao/values-dev.yaml
helm upgrade gmao ./helm/gmao -n gmao -f helm/gmao/values-dev.yaml
```
