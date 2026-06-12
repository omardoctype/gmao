# Docker Compose Runtime Results - GMAO

Validation locale executee le 2026-06-12 depuis `C:\Users\omar1\Desktop\gmao`.

Statuts autorises: `PASSED`, `FAILED`, `BLOCKED`, `NOT RUN`.

## Correction appliquee avant validation

| Point | Resultat | Status |
| --- | --- | --- |
| Conflit port MySQL | Un MySQL local (`mysqld`) occupait `3306`. Le port hote Docker MySQL est maintenant configurable avec `MYSQL_HOST_PORT`, valeur par defaut `3307`. Le reseau Compose continue d'utiliser `mysql:3306`. | PASSED |
| Donnees persistantes | `docker compose down` a ete utilise sans `-v`. Aucun volume Compose ni dossier RAG/documents/uploads n'a ete supprime. | PASSED |

## Configuration et images

| Verification | Commande | Resultat | Status |
| --- | --- | --- | --- |
| Configuration Compose | `docker compose config --quiet` | Configuration valide. | PASSED |
| Build Compose | `docker compose build` | Build des services effectue. | PASSED |
| Frontend image | `docker images gmao-frontend` | `gmao-frontend:local` environ 75 MB. | PASSED |
| Backend image | `docker images gmao-backend` | `gmao-backend:local` environ 524 MB. | PASSED |
| AI image | `docker images gmao-ai-service` | `gmao-ai-service:local` environ 671 MB. | PASSED |

## Services Compose

| Service | Port hote | Etat observe | Status |
| --- | --- | --- | --- |
| frontend | `5173 -> 80` | `Up`, healthcheck `healthy`, HTTP `200 OK`. | PASSED |
| backend | `8080 -> 8080` | `Up`, healthcheck `healthy`, `/actuator/health` = `UP`. | PASSED |
| ai-service | `8000 -> 8000` | `Up`, healthcheck `healthy`, `/health` = `UP`, modele `qwen2.5:1.5b`. | PASSED |
| mysql | `3307 -> 3306` | `Up`, healthcheck `healthy`. | PASSED |
| prometheus | `9090 -> 9090` | `/-/healthy` = `Prometheus Server is Healthy.` | PASSED |
| grafana | `3000 -> 3000` | `/api/health` database `ok`, version `11.3.1`. | PASSED |

## Smoke tests applicatifs

| Test | Resultat observe | Status |
| --- | --- | --- |
| Ollama hote Windows | `GET http://127.0.0.1:11434/api/tags` retourne `qwen2.5:1.5b`. | PASSED |
| Ollama depuis conteneur | `curlimages/curl` vers `http://host.docker.internal:11434/api/tags` retourne `qwen2.5:1.5b`. | PASSED |
| Frontend | `curl.exe -I http://127.0.0.1:5173` retourne `HTTP/1.1 200 OK`. | PASSED |
| Backend health | `GET /actuator/health` retourne `UP`. | PASSED |
| FastAPI health | `GET /health` retourne `UP`. | PASSED |
| RAG ingest | `POST /ai/ingest` retourne `indexedDocuments=9`, `totalChunks=31`. | PASSED |
| RAG ask | `POST /ai/ask` retourne une reponse non vide avec 3 sources, dont `procedure_surchauffe_moteur.md` et `manuel_presse_hydraulique_hp200.md`. | PASSED |
| AI diagnosis | `POST /ai/diagnosis` retourne `diagnosis`, 3 actions recommandees et 3 sources. | PASSED |
| Login backend JWT | `POST /api/auth/login` avec admin demo retourne un token, non affiche dans les logs. | PASSED |
| Securite predictive sans token | `GET /api/predictive/dashboard` retourne `401 Unauthorized`. | PASSED |
| Predictive via backend | `GET /api/predictive/equipments/1/risk` retourne `EQ-001`, score `56`, niveau `MEDIUM`, 6 raisons. | PASSED |
| Demo predictive mineur/critique | `EQ-PRED-LOW` score `35` `MEDIUM`; `EQ-PRED-CRIT` score `100` `CRITICAL`. | PASSED |
| Predictive + RAG | `POST /api/predictive/equipments/1/rag-analysis` retourne une analyse RAG avec 2 sources. | PASSED |

## Monitoring Compose

| Verification | Resultat observe | Status |
| --- | --- | --- |
| Prometheus targets | `gmao-backend`, `gmao-ai-service`, `prometheus` sont `up`. | PASSED |
| Grafana datasource | Datasource `Prometheus` provisionnee vers `http://prometheus:9090`. | PASSED |
| Grafana dashboard | Dossier `GMAO` et dashboard `GMAO Platform` provisionnes. | PASSED |

## Limites observees

| Limite | Impact | Status |
| --- | --- | --- |
| MySQL hote local sur `3306` | Compose expose MySQL Docker sur `3307` pour eviter le conflit; l'interne reste `mysql:3306`. | PASSED |
| AI Docker image | `sentence-transformers` est optionnel dans l'image Docker; fallback `HashingEmbedder` leger active si la dependance lourde n'est pas installee. Re-indexer `/ai/ingest` apres changement d'embedder. | PASSED |
