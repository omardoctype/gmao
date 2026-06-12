# DEPLOYMENT - GMAO Cloud Production

Ce document prepare un deploiement cloud propre et progressif de la plateforme GMAO, sans changer la logique metier.

## 1. Objectif

- Separer les services pour la production.
- Garder la compatibilite avec l architecture actuelle (`frontend`, `backend`, `ai-service`, `mysql`, `ollama`).
- Eviter `localhost` entre services en production.
- Ajouter securite, observabilite, sauvegardes, et trajectoire de scaling.

## 2. Architecture Cloud Recommandee

Architecture cible (recommandation pragmatique) :

1. `frontend` React/Vite :
- Option A (recommandee) : Vercel.
- Option B : Nginx (conteneur) derriere reverse proxy TLS.

2. `backend` Spring Boot :
- Option A (simple) : Render Web Service.
- Option B : Railway Service.
- Option C (enterprise) : Azure App Service ou AWS ECS Fargate / Elastic Beanstalk.

3. `ai-service` FastAPI :
- VPS Linux dedie (Docker), avec disque persistant pour `documents/` et `chroma_db/`.

4. `ollama` :
- VM dediee (idealement GPU) dans un reseau prive.
- Modele par defaut : `qwen2.5:1.5b`.

5. `mysql` :
- Base MySQL managee (AWS RDS MySQL ou Azure Database for MySQL).

6. reverse proxy + TLS :
- Ingress HTTPS via Cloudflare + Nginx/Caddy (ou load balancer manage cloud).
- Exposer publiquement seulement `frontend` et `backend` API.
- `ai-service`, `ollama`, `mysql` en reseau prive.

### Schema logique

```text
Internet
   |
   v
Frontend (Vercel ou Nginx)
   |
   v
Backend API (Spring Boot)
   |-------------------------------> MySQL (Managed DB)
   |
   v
AI Service (FastAPI sur VPS)
   |-------------------------------> Ollama (VM dediee)
   |
   +-------------------------------> ChromaDB (volume persistant)
   +-------------------------------> documents/ (volume persistant)

Backend uploads/ -> volume persistant
```

## 3. Environnements et URLs cibles

Exemple de domaines :

- Frontend: `https://gmao.example.com`
- Backend API: `https://api.gmao.example.com`
- AI API (privee de preference): `https://ai.gmao.internal` (ou DNS prive)
- Ollama (prive): `http://ollama.internal:11434`
- MySQL (prive): `mysql.internal:3306`

Important :
- Le navigateur appelle `https://api.gmao.example.com`.
- Le backend appelle `ai-service` via DNS prive (pas `localhost`).
- Le `ai-service` appelle `ollama` via DNS prive (pas `localhost`).

## 4. Variables d environnement

Un template central est fourni dans :
- [.env.production.example](C:/Users/omar1/Desktop/gmao/.env.production.example)

### 4.1 Frontend (build-time)

- `VITE_API_BASE_URL=https://api.gmao.example.com`

### 4.2 Backend (runtime)

Variables critiques :
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_AI_SERVICE_BASE_URL`
- `APP_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`

Variables importantes :
- `APP_JWT_EXPIRATION_MS`
- `APP_DOCUMENTS_STORAGE_DIR`
- `APP_DOCUMENTS_MAX_FILE_SIZE_BYTES`
- `APP_SEED_ADMIN_ENABLED=false`
- `APP_SEED_DEMO_ENABLED=false`
- `APP_AI_SERVICE_CONNECT_TIMEOUT_MS`
- `APP_AI_SERVICE_READ_TIMEOUT_MS`

### 4.3 AI Service (runtime)

- `SERVICE_NAME`
- `OLLAMA_URL`
- `OLLAMA_MODEL`
- `EMBEDDING_MODEL`
- `CHROMA_COLLECTION`
- `DOCUMENTS_DIR`
- `CHROMA_DIR`
- `SOURCE_DOCUMENTS_DIR`
- `AUTO_SYNC_DOCUMENTS`
- `CHUNK_SIZE`
- `CHUNK_OVERLAP`
- `TOP_K`
- `MAX_DISTANCE`

### 4.4 MySQL managed

- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD` (si necessaire selon fournisseur)

## 5. Securite Production

1. Secrets
- Jamais de secrets en dur dans le repo.
- Stocker dans le secret manager du provider (Render/Railway/Azure/AWS).
- Rotation trimestrielle minimum de `APP_JWT_SECRET` et mots de passe DB.

2. Reseau
- `mysql`, `ollama`, `ai-service` non exposes publiquement.
- Autoriser seulement les flux necessaires :
  - `backend -> mysql`
  - `backend -> ai-service`
  - `ai-service -> ollama`

3. TLS/HTTPS
- HTTPS obligatoire en frontal et API.
- Redirection HTTP vers HTTPS.
- HSTS actif.

4. CORS
- Limiter `APP_CORS_ALLOWED_ORIGINS` aux domaines frontend production.

5. Hardening
- Conteneurs non-root (deja fait dans Dockerfiles backend/ai-service).
- Limites CPU/RAM par service.
- WAF/rate limiting en edge (Cloudflare/Nginx).

## 6. Reverse Proxy

Role recommande :
- Terminaison TLS.
- Routage:
  - `gmao.example.com` -> frontend
  - `api.gmao.example.com` -> backend
- Compression + headers securite.
- Rate limiting sur `/api/auth/login` et endpoints IA.

## 7. Sauvegardes et reprise

1. MySQL manage
- Snapshot quotidien.
- PITR active (Point-In-Time Recovery).
- Retention recommandee : 7 a 30 jours selon criticite.

2. `uploads/`
- Snapshot quotidien du volume ou sync objet (S3/Blob).

3. `chroma_db/` + `documents/`
- Snapshot quotidien.
- Verification restauration au moins 1 fois/mois.

4. Ollama models
- Les modeles standards peuvent etre re-pull.
- Si modeles custom, snapshot du volume Ollama.

## 8. Monitoring et logs

Monitoring minimum :

1. Healthchecks
- Backend : `GET /actuator/health` (si active) ou check TCP `8080`.
- AI Service : `GET /health`.
- Frontend : check HTTP `200`.

2. Logs centralises
- Backend et AI vers un agregateur (Loki/ELK/Datadog).
- Correlation via `request-id` (reverse proxy).

3. Alerting
- CPU/RAM > seuil.
- 5xx API > seuil.
- indisponibilite endpoint login/ai.

4. Uptime
- Sondes externes (1 min) sur frontend et backend.

## 9. Strategie de scaling futur

Phase 1 (actuelle):
- 1 instance backend
- 1 instance ai-service
- 1 Ollama VM
- 1 MySQL managed primary

Phase 2 (croissance):
- Backend horizontal (2+ replicas) derriere load balancer.
- AI service horizontal (2+ replicas) si charge CPU elevee.
- Ollama: VM GPU plus puissante ou pool de model servers.
- MySQL: read replica + tuning indexes + cache.

Phase 3 (haute dispo):
- Multi-zone pour backend et DB.
- Failover automatise.
- Blue/Green deploy pour zero downtime.

## 10. CI/CD recommande (avec votre GitHub Actions)

Pipeline deja en place :
- Build/test backend
- Build frontend
- Build ai-service
- Docker compose build

Ajouts recommandes :
1. Job `deploy-staging` sur `develop`.
2. Job `deploy-production` sur tag `v*` ou approval manuel.
3. Migration DB controlee (si schema evolue).
4. Smoke tests post-deploiement:
- login
- `/api/ai/health`
- `/api/ai/ask`
- `/api/predictive/equipments/risk`

## 11. Estimation de cout (ordre de grandeur)

Prix observes/consultes le **28 mai 2026**. Les prix varient selon region/usage.

### Profil Startup (recommande au depart)

1. Frontend (Vercel Pro): ~`$20/mo` (+ usage).
2. Backend (Render Starter): ~`$7/mo` par service.
3. AI Service VPS (DigitalOcean 2GB): ~`$12/mo`.
4. Ollama VM dediee:
- CPU-only minimal: ~`$24-$84/mo` (AWS Lightsail selon taille).
- GPU dediee: souvent `>$200/mo` selon provider/GPU.
5. MySQL manage:
- petite instance: souvent `~$15-$60/mo` selon provider/region/options.
6. Stockage/sortant/observabilite:
- reserve `~$10-$40/mo` au demarrage.

Total indicatif:
- Sans GPU dediee: `~$64-$239/mo`.
- Avec GPU dediee: `~$260-$700+/mo` selon la carte et le trafic.

## 12. Avantages / Inconvenients

### Avantages

1. Separation claire des responsabilites.
2. Meilleure securite (reseau prive + TLS).
3. Scalabilite progressive sans re-architecture majeure.
4. RAG preserve (`documents/` + `chroma_db/` persistants).
5. Operations plus simples (managed DB, CI/CD centralise).

### Inconvenients

1. Complexite ops plus elevee qu un seul serveur.
2. Cout Ollama GPU potentiellement important.
3. Monitoring/backup demandent discipline continue.
4. Multi-provider possible (Vercel + Render + VPS + DB managee) => gouvernance plus exigeante.

## 13. Plan de mise en production recommande

1. Etape 1
- Deployer frontend + backend + MySQL managed.
- Garder `ai-service` et `ollama` en reseau prive.

2. Etape 2
- Basculer DNS + TLS final.
- Activer monitoring + alerting + backups verifies.

3. Etape 3
- Tests de charge (login, `/ai/ask`, predictive, rag-analysis).
- Ajuster tailles VM/DB selon metriques.

4. Etape 4
- Ajouter environnement staging + approbation manuelle de release.

## 14. Sources pricing/plateformes

- Vercel pricing: https://vercel.com/pricing
- Render pricing: https://render.com/pricing
- Render outbound bandwidth: https://render.com/docs/outbound-bandwidth
- Railway pricing docs: https://docs.railway.com/pricing
- Railway plans/prix ressources: https://docs.railway.com/reference/pricing/plans
- AWS Lightsail pricing: https://aws.amazon.com/lightsail/pricing/
- Azure App Service Linux pricing: https://azure.microsoft.com/en-us/pricing/details/app-service/linux/
- Azure Database for MySQL pricing: https://azure.microsoft.com/en-gb/pricing/details/mysql/
- DigitalOcean Droplets pricing: https://www.digitalocean.com/pricing/droplets

