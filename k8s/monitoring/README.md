# Kubernetes Monitoring - GMAO

Ce document prepare le monitoring Kubernetes de la plateforme GMAO avec Prometheus + Grafana, sans installer quoi que ce soit automatiquement.

## 1. Objectif

- Superviser la sante plateforme (frontend, backend, ai-service, mysql, ollama).
- Detecter rapidement les pannes (pod down, restart, saturation CPU/RAM).
- Suivre la performance API (latence, erreurs 4xx/5xx, endpoints IA/RAG).

## 2. Stack recommandee

- Helm chart: `prometheus-community/kube-prometheus-stack`
- Composants principaux:
  - Prometheus (collecte)
  - Alertmanager (alertes)
  - Grafana (visualisation)
  - kube-state-metrics + node-exporter (metriques cluster)

## 3. Installation (a executer manuellement)

Ne pas executer ces commandes dans ce sprint automatique. Elles sont prevues pour execution manuelle en environnement K8s.

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n monitoring
```

Verifier:

```bash
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

## 4. Acces Grafana

Port-forward Grafana:

```bash
kubectl port-forward svc/monitoring-grafana 3000:80 -n monitoring
```

URL locale:

- `http://localhost:3000`

Recuperer mot de passe admin:

```bash
kubectl get secret monitoring-grafana -n monitoring -o jsonpath="{.data.admin-password}" | base64 --decode; echo
```

## 5. Metriques importantes a suivre

### 5.1 Backend (Spring Boot)

- Uptime backend:
  - Pod running/ready
  - Endpoint HTTP disponible (`/api`, `/swagger-ui.html`, `/v3/api-docs`)
- Latence backend:
  - P50/P95/P99 sur routes API
- Erreurs 4xx/5xx:
  - taux par seconde et pourcentage

Note: pour un niveau applicatif fin, il faut une source metrique HTTP (Ingress controller metrics, ou endpoint applicatif Prometheus si ajoute plus tard).

### 5.2 AI service (FastAPI RAG)

- Sante service:
  - endpoint `/health`
- Temps reponse RAG:
  - `/ai/ask`
  - `/ai/diagnosis`
  - `/ai/ingest`
- Erreurs HTTP 5xx IA

Note: sans instrumentation applicative dediee, le suivi latence RAG peut etre estime via metriques Ingress/proxy. Pour un suivi precis, ajouter plus tard des histograms applicatifs.

### 5.3 MySQL

- CPU/memory pod mysql
- Restarts pod mysql
- Volume usage PVC mysql
- (Option avancee) metriques SQL fines via `mysqld-exporter`

### 5.4 Cluster / Pods

- CPU/memory par pod:
  - frontend
  - backend
  - ai-service
  - mysql
  - ollama
- Restart count
- OOMKill / CrashLoopBackOff

## 6. Dashboards Grafana recommandes

1. Kubernetes / Compute Resources / Pod
- CPU, memory, throttling, restarts.

2. Kubernetes / Networking / Namespace (si disponible)
- trafic inter-services et erreurs reseau.

3. Kubernetes / Persistent Volumes
- capacite, usage, tendance.

4. API Observability (custom)
- backend latency + 4xx/5xx
- ai-service latency + 5xx
- endpoints RAG (`/ai/ask`, `/ai/diagnosis`)

5. MySQL Overview (option `mysqld-exporter`)
- connexions, QPS, slow queries, locks.

## 7. Alertes recommandees

1. Backend down
- condition: backend pod indisponible ou readiness KO.

2. AI service down
- condition: ai-service pod indisponible ou `/health` en echec.

3. MySQL restart
- condition: restart count mysql augmente.

4. High CPU / memory
- condition: >80% sur backend/ai-service/frontend durant >5 min.

5. RAG latency high
- condition: p95 `/ai/ask` > seuil (ex: 3s ou 5s selon SLA) durant >5 min.

6. Error burst
- condition: taux 5xx backend ou ai-service au-dessus d un seuil.

## 8. Points d attention scaling/stateful

- Ne pas autoscaler MySQL comme un service stateless.
- Ne pas autoscaler Ollama "a l aveugle" (forte empreinte RAM/CPU et gestion modeles).
- `ai-service` avec `chroma_db` local/PVC doit etre scale prudemment:
  - coherence/indexation
  - I/O disque
  - contention sur data locale

## 9. Utilisation dans Sprint Cloud

Dans Sprint Cloud, ce monitoring sera utilise pour:

1. Validation de stabilite
- prouver que backend/ai-service tiennent la charge de base.

2. Baseline performance
- etablir les temps de reponse initiaux (backend + RAG).

3. Garde-fous exploitation
- detecter vite pannes/restarts/depassement ressources.

4. Decision de scaling
- justifier quand augmenter replicas ou ressources.

5. Passage production
- disposer d une vue claire SRE/DevOps avant exposition publique.

## 10. Sources

- kube-prometheus-stack README (prometheus-community): https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/README.md
- Prometheus community Helm charts: https://github.com/prometheus-community/helm-charts
- ArtifactHub kube-prometheus-stack install docs: https://artifacthub.io/packages/helm/prometheus-community/kube-prometheus-stack

