# gmao-ai-service

Service IA local (FastAPI + ChromaDB + sentence-transformers + Ollama) pour assistant RAG de maintenance industrielle.

Modèle Ollama par défaut: `qwen2.5:1.5b`.

## 1) Installation

Depuis la racine `gmao/`:

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 2) Documents RAG

Les documents sont lus dans `ai-service/documents/`.

Au lancement de `POST /ai/ingest`, le service copie automatiquement les `.md` depuis:

`backend/src/main/resources/demo-documents/`

vers:

`ai-service/documents/`

si `AUTO_SYNC_DOCUMENTS=true` (valeur par défaut).

Copie manuelle possible:

```powershell
Copy-Item ..\backend\src\main\resources\demo-documents\*.md .\documents\ -Force
```

## 3) Vérifier Ollama

```powershell
ollama list
ollama run qwen2.5:1.5b
curl http://127.0.0.1:11434/api/tags
```

## 4) Lancer le service

```powershell
uvicorn app.main:app --reload --port 8000
```

## 5) Endpoints

### `GET /health`

Réponse attendue:

```json
{
  "status": "UP",
  "service": "gmao-ai-service",
  "model": "qwen2.5:1.5b"
}
```

Exemple:

```powershell
curl.exe http://localhost:8000/health
```

### `POST /ai/ingest`

Indexe les documents et alimente ChromaDB (`ai-service/chroma_db/`).

Exemple:

```powershell
curl.exe -X POST http://localhost:8000/ai/ingest
```

Exemple de reponse si de nouveaux chunks sont ajoutes:

```json
{
  "indexedDocuments": 9,
  "newChunks": 31,
  "totalChunks": 31,
  "alreadyIndexed": false,
  "message": "Indexation terminée avec succès."
}
```

Exemple de reponse si les documents sont deja indexes:

```json
{
  "indexedDocuments": 9,
  "newChunks": 0,
  "totalChunks": 31,
  "alreadyIndexed": true,
  "message": "Documents déjà indexés. Aucun nouveau chunk ajouté."
}
```

### `POST /ai/ask`

```powershell
curl.exe -X POST "http://localhost:8000/ai/ask" -H "Content-Type: application/json" -d "{\"question\":\"Que faire en cas de fuite hydraulique sur EQ-001 ?\",\"equipmentCode\":\"EQ-001\"}"
```

### `POST /ai/diagnosis`

```powershell
curl.exe -X POST "http://localhost:8000/ai/diagnosis" -H "Content-Type: application/json" -d "{\"equipmentCode\":\"EQ-003\",\"breakdownDescription\":\"Le compresseur s'arrête après 10 minutes avec une surchauffe.\"}"
```

### `POST /ai/equipment-document/generate`

Génère une fiche technique IA structurée pour un équipement.

```powershell
curl.exe -X POST "http://localhost:8000/ai/equipment-document/generate" -H "Content-Type: application/json" -d "{\"code\":\"EQ-001\",\"name\":\"Presse hydraulique HP-200\",\"category\":\"Hydraulique\",\"brand\":\"HydroTech\",\"model\":\"HP-200\",\"serialNumber\":\"SN-001\",\"location\":\"Atelier A\",\"status\":\"OPERATIONAL\",\"criticality\":\"HIGH\",\"description\":\"Presse hydraulique utilisée pour le formage de pièces.\"}"
```

## 6) Configuration (optionnelle)

Variables d'environnement disponibles:

- `OLLAMA_URL` (défaut: `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (défaut obligatoire: `qwen2.5:1.5b`)
- `EMBEDDING_MODEL` (défaut: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`)
- `CHROMA_COLLECTION` (défaut: `gmao_documents`)
- `CHUNK_SIZE` (défaut: `900`)
- `CHUNK_OVERLAP` (défaut: `150`)
- `TOP_K` (défaut: `4`)
- `MAX_DISTANCE` (défaut: `1.20`)
- `AUTO_SYNC_DOCUMENTS` (défaut: `true`)
- `SOURCE_DOCUMENTS_DIR` (chemin source `.md`)
- `DOCUMENTS_DIR` (chemin local docs)
- `CHROMA_DIR` (chemin base Chroma persistante)

## 7) Règles de réponse intégrées

- Réponse uniquement à partir des sources récupérées.
- Fallback strict si contexte insuffisant:
  - `Je n’ai pas trouvé d’information suffisante dans la base documentaire.`
- Réponses en français, style professionnel maintenance.
- Sources toujours renvoyées dans la réponse API.

