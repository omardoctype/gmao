# Kubernetes Base - GMAO

Ce dossier contient la base Kubernetes initiale du projet GMAO.

## Fichiers

- `namespace.yaml` : cree le namespace `gmao`.
- `configmap.yaml` : contient les variables non sensibles (configuration applicative).
- `secrets.example.yaml` : exemple de Secret avec placeholders uniquement.

## Important (securite)

- Ne jamais commiter de vrais secrets dans Git.
- `secrets.example.yaml` est un modele de depart, pas un fichier de production.
- En pratique, dupliquer ce fichier localement (ex: `secrets.yaml`) et remplacer les placeholders avant application.

## Application des fichiers

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.example.yaml
```

## Remarque

- `FRONTEND_API_BASE_URL=/api` correspond au cas ou un Ingress fait le reverse proxy.
- Si frontend et backend sont exposes separement, adapter cette valeur vers l URL API cible.

## Minikube (image locale)

Pour utiliser une image backend locale avec `imagePullPolicy: IfNotPresent` :

```bash
minikube image load gmao-backend:latest
```

Pour utiliser aussi les images locales `ai-service` :

```bash
minikube image load gmao-ai-service:latest
```

Pour utiliser aussi les images locales `frontend` :

```bash
minikube image load gmao-frontend:latest
```

## Ollama URL (Kubernetes vs externe)

- Si Ollama est deployee dans Kubernetes, garder :
  - `OLLAMA_BASE_URL=http://ollama:11434`
- Si Ollama est externe/local (hors cluster), remplacer `OLLAMA_BASE_URL` dans `k8s/configmap.yaml` par l URL reachable depuis les pods Kubernetes.

## Ollama - pull manuel du modele

Apres demarrage du pod Ollama, pull du modele :

```bash
kubectl exec -it deployment/ollama -n gmao -- ollama pull qwen2.5:1.5b
```

## Note production cloud

Pour un usage cloud production, un serveur IA dedie (CPU/GPU) ou une API LLM externe est souvent preferable a un Ollama co-heberge sur un cluster applicatif generaliste.

## Frontend API variable

- Le frontend React/Nginx lit l API a la phase de build via `VITE_API_BASE_URL`.
- En pratique :
  - si reverse proxy Ingress vers backend, utiliser souvent `/api`
  - si backend expose sur une URL separee, utiliser cette URL complete

## Ingress local (Minikube + NGINX)

Activer l addon ingress :

```bash
minikube addons enable ingress
```

Recuperer l IP Minikube :

```bash
minikube ip
```

Ajouter dans le fichier `hosts` Windows (`C:\Windows\System32\drivers\etc\hosts`) :

```text
<minikube-ip> gmao.local
```

Le routing Ingress prevu :

- `/` -> `frontend:80`
- `/api` -> `backend:8080`
- `/swagger-ui.html` -> `backend:8080`
- `/v3/api-docs` -> `backend:8080`

Remarque securite :

- `ai-service`, `mysql` et `ollama` restent internes (non exposes publiquement par Ingress).

## Structure cloud-native ajoutee

En plus des manifests historiques a la racine de `k8s/`, une structure par domaine est disponible:

- `config/`: ConfigMap non sensible.
- `secrets/`: exemple de Secret sans vraies valeurs.
- `mysql/`: MySQL en StatefulSet avec stockage persistant.
- `backend/`: backend Spring Boot, service et PVC uploads.
- `frontend/`: frontend Nginx.
- `ai-service/`: FastAPI RAG avec PVC ChromaDB.
- `ollama/`: Ollama optionnel avec PVC modeles.
- `ingress/`: routage public `gmao.local`.
- `autoscaling/`: HPA stateless.
- `monitoring/`: Prometheus et Grafana de demonstration.

Application complete avec Kustomize:

```bash
kubectl apply -k k8s
```

Ordre manuel recommande:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/config/configmap.yaml
kubectl apply -f k8s/secrets/secrets.example.yaml
kubectl apply -f k8s/mysql/
kubectl apply -f k8s/ai-service/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/
kubectl apply -f k8s/autoscaling/
kubectl apply -f k8s/monitoring/
```

Monitoring rapide:

```bash
kubectl port-forward svc/prometheus 9090:9090 -n gmao
kubectl port-forward svc/grafana 3000:3000 -n gmao
```

Important scaling:

- MySQL et Ollama ne doivent pas etre scales avec HPA.
- AI Service doit etre scale prudemment si ChromaDB reste local au pod/PVC.
- Pour la production, privilegier kube-prometheus-stack ou un monitoring manage.
