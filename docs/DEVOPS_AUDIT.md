# DevOps Audit - Plateforme GMAO

Date: 2026-06-12

Ce document decrit l'etat reel de la plateforme avant consolidation DevOps. Il sert de base de travail pour Docker, Docker Compose, CI/CD, Kubernetes, Helm, monitoring et documentation.

## 1. Perimetre audite

Services applicatifs:

- `frontend/`: application React + Vite.
- `backend/`: application Spring Boot Maven.
- `ai-service/`: service FastAPI RAG avec ChromaDB et Ollama.
- `mysql`: base relationnelle utilisee par le backend.
- `ollama`: moteur LLM utilise par le service IA.

Artefacts DevOps existants:

- `Dockerfile` a la racine pour le backend.
- `frontend/Dockerfile`.
- `ai-service/Dockerfile`.
- `docker-compose.yml`.
- `.github/workflows/ci.yml`.
- `k8s/` avec manifests Kubernetes de base.
- `helm/gmao/` avec chart Helm initial.
- `k8s/monitoring/README.md`.
- `DEPLOYMENT.md`.
- `DEMO_CHECKLIST.md`.

## 2. Outils disponibles localement

Outils detectes:

- Git: disponible.
- Java: disponible.
- Maven: disponible.
- Node.js: disponible.
- npm: disponible.
- Python: disponible.

Outils non detectes dans le `PATH` local:

- Docker.
- kubectl.
- Helm.

Impact:

- Les builds Maven, npm et Python peuvent etre valides localement.
- Les commandes `docker build`, `docker compose up`, `kubectl apply` et `helm template/install` ne peuvent pas etre executees localement tant que ces outils ne sont pas installes ou ajoutes au `PATH`.

## 3. Etat Git et GitHub

Constat:

- Le dossier courant n'est pas encore un depot Git initialise.
- La commande `git status` retourne: `fatal: not a git repository`.
- Aucun remote GitHub n'est configure localement.

Risque:

- Impossible de creer une branche, committer ou pousser vers GitHub sans initialiser Git.
- Il faut absolument ajouter un `.gitignore` avant un premier commit pour eviter de versionner `.env`, fichiers logs, artefacts de build, bases locales, `node_modules`, `target`, `chroma_db`, `uploads` ou secrets.

Action recommandee:

- Creer un `.gitignore` racine.
- Creer un `.env.example` sans secret.
- Initialiser Git.
- Creer la branche `devops/cloud-native`.
- Ajouter le remote `https://github.com/omardoctype/gmao.git`.
- Ne jamais committer le fichier `.env` reel.

## 4. Docker existant

### Backend

Fichier existant: `Dockerfile` a la racine.

Points positifs:

- Build multi-stage.
- Runtime Eclipse Temurin JRE.
- Utilisateur non-root.
- Port 8080 expose.

Probleme principal:

- Le Dockerfile utilise Java 17, alors que `backend/pom.xml` declare Java 21.

Impact:

- Le build Docker backend peut echouer si le code ou les dependances exigent Java 21.

Action recommandee:

- Passer le Dockerfile backend a Eclipse Temurin 21.
- Garder un runtime JRE leger.
- Eviter de copier des dependances inutiles.

### Frontend

Fichier existant: `frontend/Dockerfile`.

Constat:

- Le Dockerfile installe les dependances, build le projet, puis demarre le serveur Vite en mode developpement sur le port 5173.

Points positifs:

- Fonctionne pour developpement local.
- Compatible avec Vite.

Limite:

- Ce n'est pas une image de production optimale.
- Pour production ou cloud, il est preferable de servir `dist/` via Nginx.

Action recommandee:

- Transformer le Dockerfile frontend en multi-stage `node -> nginx`.
- Ajouter une configuration Nginx compatible React Router.
- Exposer le port 80 dans le conteneur et mapper `5173:80` en local si necessaire.

### AI Service

Fichier existant: `ai-service/Dockerfile`.

Points positifs:

- Image Python slim.
- Build des wheels dans un stage separe.
- Utilisateur non-root.
- Volumes declares pour `documents` et `chroma_db`.
- Demarrage automatique avec Uvicorn.

Limites:

- `chroma_db` est copie dans l'image si present, ce qui peut alourdir l'image et melanger donnees runtime et artefact immutable.
- La configuration Ollama doit utiliser un nom reseau Docker ou `host.docker.internal`, jamais `localhost` depuis le conteneur.

Action recommandee:

- Garder `documents/` et `chroma_db/` comme volumes persistants.
- Exclure les donnees runtime lourdes du build context si elles sont montees par volume.
- Ajouter un endpoint ou une exposition `/metrics` pour Prometheus si le monitoring applicatif est souhaite.

## 5. Docker Compose existant

Fichier existant: `docker-compose.yml`.

Services existants:

- `mysql`.
- `ollama`.
- `ollama-pull`.
- `ai-service`.
- `backend`.
- `frontend`.

Points positifs:

- Reseau Docker dedie.
- Volumes persistants pour MySQL et Ollama.
- Volumes locaux pour documents RAG, ChromaDB et uploads.
- Variables d'environnement deja adaptees aux noms de services Docker.
- Healthchecks presents sur plusieurs services.

Limites:

- Pas de services Prometheus/Grafana.
- Frontend lance en mode Vite dev server.
- Ollama est containerise par defaut, alors que sur Windows local il peut etre plus realiste d'utiliser Ollama installe sur l'hote avec `host.docker.internal`.

Action recommandee:

- Ajouter Prometheus et Grafana.
- Clarifier deux modes Ollama:
  - Mode local Windows: `OLLAMA_URL=http://host.docker.internal:11434`.
  - Mode conteneur optionnel: service `ollama` active via profile Docker Compose.
- Garder `mysql`, `uploads`, `documents`, `chroma_db` persistants.

## 6. CI/CD GitHub Actions existante

Fichier existant: `.github/workflows/ci.yml`.

Etapes existantes:

- Checkout.
- Setup Java.
- Setup Node.js.
- Setup Python.
- Build/test backend.
- Build frontend.
- Validation Python ai-service.
- `docker compose build`.

Points positifs:

- Une pipeline de base existe.
- Les trois stacks sont couvertes.

Limites:

- Workflow unique, peu segmente.
- Pas de publication d'images Docker.
- Pas de GHCR.
- Pas de validation Helm/Kubernetes.
- Pas de separation claire entre CI, Docker build et deploiement.

Action recommandee:

- Creer une pipeline `ci-cd.yml` avec jobs separes:
  - `backend`.
  - `frontend`.
  - `ai-service`.
  - `docker-build`.
  - `helm-k8s-validate`.
  - `summary`.
- Publier les images vers GHCR uniquement sur branche principale ou tags.
- Garder les secrets GitHub hors du code.

## 7. Kubernetes existant

Dossier existant: `k8s/`.

Manifests presents:

- Namespace.
- ConfigMap.
- Secret exemple.
- MySQL PVC/Deployment/Service.
- Backend Deployment/Service.
- AI Service PVC/Deployment/Service.
- Ollama PVC/Deployment/Service.
- Frontend Deployment/Service.
- Ingress.
- HPA.
- Documentation monitoring.

Points positifs:

- La base Kubernetes est deja preparee.
- Les services internes utilisent des noms Kubernetes.
- Les composants sensibles ne sont pas exposes publiquement.
- Ingress `gmao.local` existe.

Limites:

- MySQL est decrit comme Deployment, alors qu'un StatefulSet est plus adapte pour une base de donnees avec stockage persistant.
- Structure plate moins lisible pour un projet cloud-native complet.
- Pas de manifests Prometheus/Grafana reels dans `k8s/monitoring`.
- Les images sont locales (`gmao-backend`, `gmao-frontend`, `gmao-ai-service`) plutot que configurees pour GHCR.

Action recommandee:

- Conserver les manifests existants comme reference.
- Ajouter une structure plus professionnelle par domaine:
  - `k8s/config/`.
  - `k8s/secrets/`.
  - `k8s/mysql/`.
  - `k8s/backend/`.
  - `k8s/frontend/`.
  - `k8s/ai-service/`.
  - `k8s/ollama/`.
  - `k8s/ingress/`.
  - `k8s/monitoring/`.
  - `k8s/autoscaling/`.
- Migrer MySQL vers StatefulSet dans les nouveaux manifests.

## 8. Helm existant

Dossier existant: `helm/gmao/`.

Fichiers presents:

- `Chart.yaml`.
- `values.yaml`.
- templates pour namespace, configmap, secrets, services, deployments, PVC, ingress et HPA.

Points positifs:

- Le chart Helm est deja initialise.
- Les replicas, ports et images sont configurables.
- Les secrets sont fournis comme placeholders.

Limites:

- Pas de `_helpers.tpl`.
- Pas de `values-dev.yaml`.
- Pas de `values-prod.yaml`.
- Pas de `NOTES.txt`.
- Pas de templates monitoring.
- MySQL est encore base sur Deployment.
- Les valeurs par defaut ne ciblent pas GHCR.

Action recommandee:

- Ajouter les helpers Helm.
- Ajouter des values separes dev/prod.
- Ajouter `NOTES.txt`.
- Rendre les images compatibles GHCR:
  - `ghcr.io/omardoctype/gmao-backend`.
  - `ghcr.io/omardoctype/gmao-frontend`.
  - `ghcr.io/omardoctype/gmao-ai-service`.
- Garder les secrets sous forme de valeurs exemple uniquement.

## 9. Monitoring existant

Constat:

- Une documentation Kubernetes monitoring existe dans `k8s/monitoring/README.md`.
- Aucun dossier racine `monitoring/` n'a ete detecte avec configuration Prometheus/Grafana.
- Le backend ne declare pas encore Actuator/Micrometer Prometheus dans `pom.xml`.
- Le service IA ne declare pas encore de client Prometheus dans `requirements.txt`.

Action recommandee:

- Backend:
  - Ajouter Spring Boot Actuator.
  - Ajouter Micrometer Prometheus registry.
  - Exposer `/actuator/health` et `/actuator/prometheus`.
- AI service:
  - Ajouter `prometheus-client`.
  - Exposer `/metrics`.
  - Ajouter metriques simples: requetes, latence, erreurs.
- Monitoring:
  - Creer `monitoring/prometheus/prometheus.yml`.
  - Creer provisioning Grafana.
  - Ajouter un dashboard JSON simple pour la plateforme.

## 10. Variables d'environnement importantes

Backend:

- `SPRING_DATASOURCE_URL`.
- `SPRING_DATASOURCE_USERNAME`.
- `SPRING_DATASOURCE_PASSWORD`.
- `APP_JWT_SECRET`.
- `APP_CORS_ALLOWED_ORIGINS`.
- `APP_AI_SERVICE_BASE_URL`.
- `APP_DOCUMENTS_STORAGE_DIR`.

AI Service:

- `AI_PROVIDER`.
- `OLLAMA_URL` ou `OLLAMA_BASE_URL`.
- `OLLAMA_MODEL`.
- `DOCUMENTS_DIR`.
- `SOURCE_DOCUMENTS_DIR`.
- `CHROMA_DIR`.
- `AUTO_SYNC_DOCUMENTS`.

Frontend:

- `VITE_API_BASE_URL` ou variable equivalente selon implementation existante.

MySQL:

- `MYSQL_DATABASE`.
- `MYSQL_USER`.
- `MYSQL_PASSWORD`.
- `MYSQL_ROOT_PASSWORD`.

Monitoring:

- `GF_SECURITY_ADMIN_USER`.
- `GF_SECURITY_ADMIN_PASSWORD`.

## 11. Risques securite identifies

Points a corriger avant publication GitHub:

- Un fichier `.env` reel existe a la racine et ne doit jamais etre committe.
- Les secrets applicatifs doivent etre lus depuis variables d'environnement ou Secrets Kubernetes.
- Les logs SQL verbeux peuvent exposer des donnees sensibles en environnement production.
- Les endpoints internes `mysql`, `ollama` et `ai-service` ne doivent pas etre exposes publiquement.
- Les mots de passe Grafana, MySQL, JWT et seed admin doivent etre fournis par secrets externes.

Bonnes pratiques recommandees:

- Versionner uniquement `.env.example`.
- Ajouter `.gitignore` racine.
- Utiliser GitHub Secrets pour CI/CD.
- Utiliser Kubernetes Secrets en cluster.
- Eviter `permitAll` sur les endpoints metier.
- Garder HTTPS via reverse proxy ou Ingress TLS en production.

## 12. Composants hors Docker

Peuvent rester hors Docker selon le contexte local:

- Ollama sur Windows ou machine hote, accessible depuis les conteneurs via `host.docker.internal:11434`.
- Docker Desktop / daemon Docker.
- kubectl et Helm.
- Registry GHCR.

Important:

- Depuis un conteneur, `localhost` pointe vers le conteneur lui-meme, pas vers la machine hote.
- Pour Ollama local hors Docker, l'URL doit etre `http://host.docker.internal:11434`.
- Pour Ollama dans Kubernetes, l'URL doit etre `http://ollama:11434`.

## 13. Composants pertinents a containeriser

Composants a containeriser:

- Backend Spring Boot.
- Frontend React servi par Nginx.
- AI Service FastAPI.
- MySQL pour environnement local/demo.
- Prometheus.
- Grafana.

Composants a containeriser avec prudence:

- Ollama, car il consomme beaucoup de RAM/CPU et les modeles sont volumineux.

## 14. Plan d'implementation propose

Ordre recommande:

1. Creer `.gitignore` et `.env.example` securises.
2. Initialiser Git et creer la branche `devops/cloud-native`.
3. Corriger les Dockerfiles backend/frontend/ai-service.
4. Mettre a jour `docker-compose.yml` avec monitoring et configuration Ollama realiste.
5. Ajouter Prometheus/Grafana.
6. Ajouter metriques backend et ai-service.
7. Ajouter scripts de validation.
8. Restructurer ou completer Kubernetes proprement.
9. Completer Helm.
10. Remplacer/ameliorer la pipeline GitHub Actions.
11. Mettre a jour `README.md` et documentation DevOps.
12. Executer les validations disponibles localement.
13. Produire le commit final.
14. Pousser vers GitHub seulement si l'authentification Git est disponible.

## 15. Limites de validation actuelles

Validation possible localement:

- Compilation backend Maven.
- Build frontend npm.
- Installation/compilation Python ai-service.
- Validation syntaxique YAML via outils disponibles ou scripts Python.

Validation non possible actuellement sans installer les outils manquants:

- `docker build`.
- `docker compose up`.
- `kubectl apply --dry-run`.
- `helm template`.
- `helm install`.

Conclusion:

- La base DevOps existe deja, mais elle doit etre consolidee pour etre coherente, securisee, reproductible et presentable comme lifecycle cloud-native complet.
- Les corrections prioritaires sont la securisation Git, la coherence Java 21, le frontend Nginx, le monitoring, la pipeline CI/CD et la clarification Ollama local vs conteneur.
