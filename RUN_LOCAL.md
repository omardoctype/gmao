# Lancement local GMAO (Windows)

Ce mode est prevu pour le developpement local.

## Prerequis

- Java 21
- Maven
- Node.js + npm
- Python
- Ollama
- MySQL / WAMP (selon votre configuration backend)
- Modele Ollama `qwen2.5:1.5b`

## Preparation initiale

```bat
ollama pull qwen2.5:1.5b
```

```bat
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

```bat
cd ..\frontend
npm install
```

## Demarrer toute la plateforme

Depuis la racine du projet `gmao` :

```bat
run-gmao.bat
```

Le script ouvre des fenetres separees (logs visibles) pour :

- Ollama (si non deja actif)
- ai-service FastAPI (`uvicorn`)
- backend Spring Boot (`mvn spring-boot:run`)
- frontend React (`npm run dev`)

## Arreter les services locaux

Depuis la racine du projet `gmao` :

```bat
stop-gmao.bat
```

Le script tente d'arreter les fenetres/services locaux lies a la plateforme.
Il ne supprime pas les donnees (MySQL, `chroma_db`, `documents`, `uploads`).

## Tests rapides

```bat
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:11434/api/tags
```

Puis ouvrir :

- http://127.0.0.1:5173

## Note DevOps / Cloud

Ce mode de lancement est destine au developpement local.
Dans le sprint DevOps/Cloud, ce demarrage manuel sera remplace par Docker Compose ou une orchestration cloud.
