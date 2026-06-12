# CI Failure Analysis - GitHub Actions Disk Exhaustion

Date: 2026-06-12

Branch: `devops/cloud-native`

Workflow: `GMAO CI/CD`

## Failed job

Job:

- `Docker - build images and compose config`

Exact error reported by GitHub Actions:

```text
System.IO.IOException: No space left on device
```

Consequence:

- Kubernetes and Helm validation was skipped because it depended on the failed Docker job.
- GHCR publication was skipped.
- CI/CD summary failed.

## Previous CI design

The previous `docker-build` job did all Docker work on one GitHub-hosted runner:

1. `docker compose config`
2. `docker build` backend image
3. `docker build` frontend image
4. `docker build` ai-service image
5. `docker compose build`

This means the same ephemeral runner stored:

- Maven build layers.
- Node/Vite build layers.
- Python/AI dependencies and wheels.
- Three application Docker images.
- Compose-built duplicate images.
- BuildKit intermediate cache.

## Root cause

The root cause is disk exhaustion on the GitHub-hosted runner caused by building all Docker images and then running `docker compose build` again in one job.

The risk was amplified by:

- Duplicate image builds in the same job.
- BuildKit cache accumulating across steps.
- Compose rebuilding services that had already been built individually.
- Large dependency stacks: Maven, Node/Vite and Python/ML dependencies.
- AI service dependencies such as ChromaDB and sentence-transformers.

## Disk-efficient correction

The Docker validation must be split into independent jobs:

- `compose-validation`: only renders and validates Docker Compose configuration.
- `docker-build-frontend`: builds only the frontend image.
- `docker-build-backend`: builds only the backend image.
- `docker-build-ai-service`: builds only the AI service image.

Each image build job must:

1. Show disk usage before the build.
2. Build a single image.
3. Inspect the image.
4. Show the image size.
5. Remove only the temporary CI image.
6. Prune only temporary builder cache in the ephemeral runner with `docker builder prune -af`.

The Kubernetes/Helm static validation must not depend on Docker image builds. It should depend only on source-level validation jobs:

- backend validation
- frontend validation
- ai-service validation

## What this does not prove

A successful static CI validation does not prove a live Kubernetes runtime.

Runtime validation must be performed separately with real commands:

- Docker Compose start and smoke tests.
- Helm deployment to a real cluster.
- Kubernetes pod/service/PVC checks.
- Prometheus target checks.
- Grafana dashboard checks.
- Application smoke tests.
