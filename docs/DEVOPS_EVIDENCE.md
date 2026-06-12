# DevOps Evidence Guide - GMAO

Ce guide liste les captures utiles pour le rapport PFE. Ne jamais afficher de valeurs de secrets, de tokens JWT ou de mots de passe.

## Figure 4.16 - Pipeline GitHub Actions

Commande/page:

```powershell
# Depuis GitHub: Actions > GMAO CI/CD > branche devops/cloud-native
# Run valide: https://github.com/omardoctype/gmao/actions/runs/27444143226
```

A rendre visible:

- Branche `devops/cloud-native`.
- Jobs requis verts: backend, frontend, ai-service, compose config, builds Docker separes, Helm/Kustomize static validation, summary.
- GHCR publication peut etre `skipped` sur branche feature si non demandee.

A cacher:

- Tokens, variables d'environnement sensibles, logs contenant des secrets.

## Figure 4.19 - Dashboard Grafana

Docker Compose:

```powershell
http://localhost:3000
```

Kubernetes:

```powershell
kubectl port-forward -n gmao service/grafana 3000:3000
http://localhost:3000
```

A rendre visible:

- Dashboard `GMAO Platform`.
- Time range recent.
- Panneaux avec valeurs reelles: `Backend Up`, `AI Service Up`, `Backend Request Rate`, `AI/RAG Average Duration`.

A cacher:

- Mot de passe Grafana.

## Figure 4.20 - Structure du chart Helm

Commande:

```powershell
tree .\helm\gmao /F
```

A rendre visible:

- `Chart.yaml`.
- `values.yaml`, `values-dev.yaml`, `values-prod.yaml` si presents.
- `templates/` avec deployments, services, PVC, monitoring, ingress, HPA.

## Figure 4.21 - Images Docker generees

Commande:

```powershell
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedSince}}\t{{.Size}}"
```

A rendre visible:

- `gmao-frontend:dev` et/ou `gmao-frontend:local`.
- `gmao-backend:dev` et/ou `gmao-backend:local`.
- `gmao-ai-service:dev` et/ou `gmao-ai-service:local`.

## Figure 4.22 - Pods Kubernetes en execution

Commande:

```powershell
kubectl get pods -n gmao -o wide
```

Etat attendu:

- Pods `Running`.
- Containers `READY 1/1`.
- Redemarrages acceptables: `0` apres la derniere revision Helm.

## Figure 4.23 - ConfigMaps et Secrets

Commande:

```powershell
kubectl get configmaps,secrets -n gmao
```

A rendre visible:

- Noms et nombre de donnees.
- `gmao-config`.
- `gmao-secrets` sans valeurs.
- ConfigMaps Grafana/Prometheus.

A cacher:

- `kubectl describe secret` et tout decodage base64.

## Figure 4.24 - Volumes persistants

Commandes:

```powershell
kubectl get pv
kubectl get pvc -n gmao
```

Etat attendu:

- PVC `mysql-pvc` `Bound`.
- PVC `ai-service-data-pvc` `Bound`.
- PVC `backend-uploads-pvc` `Bound`.

## Captures complementaires utiles

```powershell
helm list -n gmao
helm status gmao -n gmao
kubectl get services -n gmao
kubectl get deployments,statefulsets -n gmao
kubectl get hpa -n gmao
```

Note HPA locale:

- Sur Docker Desktop Kubernetes, les HPA peuvent afficher `cpu: <unknown>` si `metrics-server` n'est pas installe.
- Cela ne bloque pas le deploiement applicatif, mais doit etre mentionne honnetement.

## Tests applicatifs a capturer si besoin

```powershell
curl.exe -I http://127.0.0.1:8088
curl.exe http://127.0.0.1:8000/health
curl.exe http://127.0.0.1:8080/actuator/health
curl.exe http://127.0.0.1:9090/-/healthy
```

Pour les endpoints securises, afficher uniquement le statut HTTP et les champs metier, jamais le token JWT.
