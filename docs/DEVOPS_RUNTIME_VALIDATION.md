# DevOps Runtime Validation - GMAO

Validation mise a jour le 2026-06-12 22:32 +01:00 depuis `C:\Users\omar1\Desktop\gmao`.

Statuts autorises: `PASSED`, `FAILED`, `BLOCKED`, `NOT RUN`.

## Toolchain locale verifiee

| Composant | Commande | Resultat | Status |
| --- | --- | --- | --- |
| Branche Git | `git branch --show-current` | `devops/cloud-native` | PASSED |
| Synchronisation Git | `git pull --ff-only origin devops/cloud-native` | A jour avant modifications | PASSED |
| Docker CLI | `docker --version` | Docker `29.1.3` | PASSED |
| Docker Compose | `docker compose version` | Compose `v2.40.3-desktop.1` | PASSED |
| Docker engine | `docker info` | Engine Linux Docker Desktop actif | PASSED |
| kubectl | `kubectl version --client` | Client `v1.34.1`, Kustomize `v5.7.1` | PASSED |
| Kubernetes context | `kubectl config current-context` | `docker-desktop` | PASSED |
| Kubernetes node | `kubectl get nodes -o wide` | Node `docker-desktop` `Ready`, Kubernetes `v1.34.1` | PASSED |
| Helm | `helm version` | Helm `v4.2.1` | PASSED |

## Matrice globale

| Component | Static validation | Runtime validation | Evidence | Status |
| --- | --- | --- | --- | --- |
| GitHub Actions | PASSED | PASSED | Run `27444143226` success: backend, frontend, ai-service, compose config, Docker images, Helm/Kustomize static validation, summary. GHCR publish skipped on feature branch. | PASSED |
| Backend tests | PASSED | PASSED | `mvn -B -ntp test`: 48 tests, 0 failures, 0 errors | PASSED |
| Frontend build | PASSED | PASSED | Docker build frontend + page Nginx HTTP `200 OK` | PASSED |
| AI service validation | PASSED | PASSED | `python -m compileall app`; `/health`, `/ai/ingest`, `/ai/ask`, `/ai/diagnosis` OK | PASSED |
| Compose configuration | PASSED | PASSED | `docker compose config --quiet` OK | PASSED |
| Docker frontend image | PASSED | PASSED | `gmao-frontend:dev/local`, environ `75 MB` | PASSED |
| Docker backend image | PASSED | PASSED | `gmao-backend:dev/local`, environ `524 MB` | PASSED |
| Docker AI image | PASSED | PASSED | `gmao-ai-service:dev/local`, environ `671 MB` | PASSED |
| Docker Compose runtime | PASSED | PASSED | `docker compose up -d`, services principaux running/healthy | PASSED |
| MySQL | PASSED | PASSED | Compose health `healthy`; K8s StatefulSet `mysql` `1/1`; PVC `Bound` | PASSED |
| Backend health | PASSED | PASSED | Compose et K8s `/actuator/health` = `UP` | PASSED |
| FastAPI health | PASSED | PASSED | Compose et K8s `/health` = `UP`, modele `qwen2.5:1.5b` | PASSED |
| Ollama connectivity | PASSED | PASSED | Hote Windows, conteneur Docker et pod Kubernetes atteignent `/api/tags` avec `qwen2.5:1.5b` | PASSED |
| ChromaDB persistence | PASSED | PASSED | K8s: apres restart `ai-service`, `/ai/ingest` retourne `newChunks=0`, `totalChunks=31`, `alreadyIndexed=true` | PASSED |
| Kubernetes node | PASSED | PASSED | `docker-desktop` `Ready` | PASSED |
| Kubernetes pods | PASSED | PASSED | `frontend`, `backend`, `ai-service`, `mysql`, `prometheus`, `grafana` `Running`, `READY 1/1` | PASSED |
| Kubernetes services | PASSED | PASSED | Services ClusterIP: `frontend`, `backend`, `ai-service`, `mysql`, `prometheus`, `grafana` | PASSED |
| Helm lint | PASSED | NOT RUN | `helm lint .\helm\gmao` OK, uniquement info icon recommandee | PASSED |
| Helm template | PASSED | NOT RUN | `helm template ... --debug` genere un fichier non vide dans `tmp/` | PASSED |
| Helm deployment | PASSED | PASSED | `helm upgrade --install gmao ... --wait`, release `deployed`, revision `3` | PASSED |
| ConfigMaps | PASSED | PASSED | `gmao-config`, `prometheus-config`, `grafana-*` presents | PASSED |
| Secrets | PASSED | PASSED | `gmao-secrets` present avec 9 cles; valeurs non affichees | PASSED |
| PVCs | PASSED | PASSED | `mysql-pvc` 5Gi, `ai-service-data-pvc` 2Gi, `backend-uploads-pvc` 2Gi tous `Bound` | PASSED |
| HPA | PASSED | BLOCKED | Objets HPA presents; CPU `unknown` car `metrics-server` absent dans Docker Desktop Kubernetes | BLOCKED |
| Prometheus targets | PASSED | PASSED | Targets `gmao-backend`, `gmao-ai-service`, `prometheus` en `up` | PASSED |
| Grafana dashboard | PASSED | PASSED | Datasource Prometheus et dashboard `GMAO Platform` provisionnes; requetes basees sur metriques reelles | PASSED |
| Frontend on Kubernetes | PASSED | PASSED | `kubectl port-forward svc/frontend 8088:80`; HTTP `200 OK` | PASSED |
| Backend on Kubernetes | PASSED | PASSED | `kubectl port-forward svc/backend 8080:8080`; health `UP`, login admin OK | PASSED |
| FastAPI on Kubernetes | PASSED | PASSED | `kubectl port-forward svc/ai-service 8000:8000`; `/health` OK | PASSED |
| RAG request | PASSED | PASSED | `/ai/ask` reponse non vide, 3 sources dont `.md` | PASSED |
| Diagnosis request | PASSED | PASSED | `/ai/diagnosis` retourne diagnostic, 3 actions, 3 sources | PASSED |
| Predictive request | PASSED | PASSED | `EQ-001` score `56`, niveau `MEDIUM`, 6 raisons | PASSED |
| Predictive demo comparison | PASSED | PASSED | `EQ-PRED-LOW` score `35 MEDIUM`; `EQ-PRED-CRIT` score `100 CRITICAL` | PASSED |
| Predictive + RAG | PASSED | PASSED | `/api/predictive/equipments/1/rag-analysis` retourne analyse RAG avec 2 sources | PASSED |

## GitHub Actions

| Champ | Valeur |
| --- | --- |
| Workflow | GMAO CI/CD |
| Run URL | https://github.com/omardoctype/gmao/actions/runs/27444143226 |
| Branche | devops/cloud-native |
| Commit teste | 0ed4c9a62c0ca879df8692207ee4680884f994ef |
| Conclusion | success |
| Jobs success | Backend, Frontend, AI Service, Docker Compose static validation, Docker image frontend, Docker image backend, Docker image ai-service, Kubernetes and Helm static validation, CI/CD summary |
| Job skipped attendu | GHCR publication, car limitee a main, tags ou dispatch manuel publish=true |

## Resultats Kubernetes actuels importants

| Commande | Resume |
| --- | --- |
| `helm list -n gmao` | `gmao`, chart `gmao-0.2.0`, status `deployed` |
| `kubectl get pods -n gmao -o wide` | Tous les pods applicatifs `Running`, `READY 1/1`, redemarrages `0` sur la revision finale |
| `kubectl get pvc -n gmao` | `mysql-pvc`, `ai-service-data-pvc`, `backend-uploads-pvc` `Bound` |
| `kubectl get hpa -n gmao` | HPA crees, CPU `unknown` sans `metrics-server` |

## Incidents reels et corrections

| Incident | Cause | Correction | Status |
| --- | --- | --- | --- |
| GitHub Actions `No space left on device` | Un job Docker unique accumulait les builds backend/frontend/AI et Compose sur le meme runner | Workflow scinde en jobs Docker separes + contextes Docker ignores + nettoyage cache uniquement dans runner CI | PASSED localement et sur GitHub Actions |
| Compose MySQL port `3306` indisponible | MySQL local Windows utilisait deja `3306` | `MYSQL_HOST_PORT` ajoute, defaut `3307`; reseau interne inchange `mysql:3306` | PASSED |
| AI Docker image trop lourde/lente | `sentence-transformers` tirait PyTorch et rendait le build AI trop lourd pour CI/local | Dependence rendue optionnelle; fallback `HashingEmbedder` deterministe leger | PASSED |
| Backend K8s redemarrages initiaux | Spring Boot demarrait avant que MySQL soit pret pour les metadonnees JDBC | `initContainer wait-for-mysql` ajoute au backend Helm/Kustomize | PASSED |
| HPA CPU inconnu | `metrics-server` absent du cluster Docker Desktop | Documente comme limite locale; installer `metrics-server` pour tester l'autoscaling CPU reel | BLOCKED |

## Commandes de capture recommandees

Voir `docs/DEVOPS_EVIDENCE.md` pour les commandes exactes et les consignes de masquage.
