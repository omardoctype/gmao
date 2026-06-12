# GMAO industrielle intelligente

Plateforme GMAO multi-services pour demonstration PFE:

- Frontend React + Vite servi par Nginx.
- Backend Spring Boot + JWT + MySQL.
- AI Service FastAPI RAG avec ChromaDB.
- Ollama avec le modele `qwen2.5:1.5b`.
- Monitoring Prometheus + Grafana.
- Preparation Docker, Docker Compose, Kubernetes, Helm et GitHub Actions.

## Architecture locale Docker Compose

Services principaux:

- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- AI Service: http://localhost:8000
- MySQL: localhost:3306
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Ollama local hote: http://localhost:11434

Par defaut, `docker-compose.yml` suppose que Ollama tourne sur la machine hote Windows et que l'ai-service y accede via:

```bash
OLLAMA_URL=http://host.docker.internal:11434
```

Pour utiliser Ollama en conteneur Docker a la place:

```bash
docker compose --profile ollama-container up --build
docker compose --profile ollama-container exec ollama ollama pull qwen2.5:1.5b
```

## Demarrage avec Docker Compose

Creer un fichier `.env` local depuis l'exemple:

```bash
cp .env.example .env
```

Puis remplacer les valeurs `CHANGE_ME`.

Demarrer:

```bash
docker compose up --build
```

Tests rapides:

```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8000/health
curl http://localhost:9090/-/healthy
```

Le frontend est expose sur `http://localhost:5173` et route les appels `/api` vers le backend via Nginx.

## Mode local classique Windows

Le projet conserve les scripts historiques:

```powershell
.\run-gmao.bat
.\stop-gmao.bat
```

Ce mode reste utile pour la demonstration locale sans Docker.

## Monitoring

Docker Compose lance:

- Prometheus sur `http://localhost:9090`.
- Grafana sur `http://localhost:3000`.

Prometheus scrape:

- `backend:8080/actuator/prometheus`.
- `ai-service:8000/metrics`.

Le dashboard Grafana local est provisionne depuis:

- `monitoring/grafana/dashboards/gmao-platform-dashboard.json`.

## Kubernetes

Les manifests historiques plats sont conserves dans `k8s/`.

Une structure plus propre est aussi disponible:

- `k8s/config/`
- `k8s/secrets/`
- `k8s/mysql/`
- `k8s/backend/`
- `k8s/frontend/`
- `k8s/ai-service/`
- `k8s/ollama/`
- `k8s/ingress/`
- `k8s/autoscaling/`
- `k8s/monitoring/`

Application avec Kustomize:

```bash
kubectl apply -k k8s
```

Important:

- `k8s/secrets/secrets.example.yaml` contient uniquement des placeholders.
- En production, creer un vrai Secret Kubernetes avant de deployer.
- MySQL et Ollama utilisent un stockage persistant.
- AI Service persiste `chroma_db`.
- Backend persiste `uploads`.

Minikube Ingress:

```bash
minikube addons enable ingress
minikube ip
```

Ajouter dans le fichier hosts Windows:

```text
<minikube-ip> gmao.local
```

Acces:

- Frontend: `http://gmao.local`
- Backend API: `http://gmao.local/api`
- Swagger: `http://gmao.local/swagger-ui.html`

## Helm

Installer en local/demo:

```bash
helm install gmao ./helm/gmao -n gmao --create-namespace -f helm/gmao/values-dev.yaml
```

Mettre a jour:

```bash
helm upgrade gmao ./helm/gmao -n gmao -f helm/gmao/values-dev.yaml
```

Rendu sans installer:

```bash
helm template gmao ./helm/gmao -n gmao -f helm/gmao/values-dev.yaml
```

Production:

```bash
helm upgrade --install gmao ./helm/gmao -n gmao -f helm/gmao/values-prod.yaml
```

En production, ne pas utiliser les secrets de demonstration. Utiliser Kubernetes Secrets, External Secrets ou le secret manager du cloud.

## CI/CD

Workflow GitHub Actions:

- `.github/workflows/ci-cd.yml`

Jobs:

- Backend Maven test/package.
- Frontend npm build.
- AI Service install/compile.
- Docker build et `docker compose config`.
- Helm lint/template.
- Publication GHCR sur `main` ou tag `v*`.

Images cible:

- `ghcr.io/omardoctype/gmao-backend`
- `ghcr.io/omardoctype/gmao-frontend`
- `ghcr.io/omardoctype/gmao-ai-service`

## Validation locale

Windows:

```powershell
.\scripts\validate-devops.ps1
```

Linux/macOS:

```bash
bash scripts/validate-devops.sh
```

Si Docker, kubectl ou Helm ne sont pas installes, les scripts affichent `SKIP` pour ces validations au lieu d'inventer un succes.

## Securite

Regles importantes:

- Ne jamais committer `.env`.
- Ne jamais committer de vrais secrets Kubernetes.
- Garder MySQL, Ollama et AI Service non publics.
- Exposer uniquement frontend, backend API et Swagger selon besoin.
- Utiliser HTTPS en cloud via Ingress TLS, reverse proxy ou service managed.
- Changer `APP_JWT_SECRET`, mots de passe MySQL et Grafana avant production.

## Documentation DevOps

Audit detaille:

- `docs/DEVOPS_AUDIT.md`

Documentation cloud:

- `DEPLOYMENT.md`

Checklist demonstration:

- `DEMO_CHECKLIST.md`
