# DEMO CHECKLIST - GMAO Platform

## 1) Services a lancer
1. Ouvrir un terminal a la racine `gmao/`.
2. Lancer la plateforme:
   - `run-gmao.bat`
3. Verifier rapidement:
   - Ollama: `http://127.0.0.1:11434/api/tags`
   - AI service: `http://127.0.0.1:8000/health`
   - Backend: `http://127.0.0.1:8080` (401 attendu sans JWT)
   - Frontend: `http://127.0.0.1:5173`

## 2) Comptes de test
- Admin:
  - Email: `admin@gmao.com`
  - Password: `Admin123!`

## 3) Equipement conseille pour la demo
- Equipement principal: `EQ-001` (Presse hydraulique HP-200)
- Equipement secondaire (convoyeur): `EQ-002`

## 4) Etapes de demonstration (encadrant)
1. **Demarrage local**
   - Executer `run-gmao.bat`.
   - Montrer que les 4 services repondent.

2. **Login admin (frontend)**
   - Aller sur `http://127.0.0.1:5173`.
   - Se connecter avec `admin@gmao.com` / `Admin123!`.

3. **Dashboard**
   - Montrer les indicateurs: total equipments, open breakdowns, work orders, critical stock.
   - Montrer les listes recentes (work orders / priority breakdowns).

4. **Equipements**
   - Ouvrir la liste des equipements.
   - Ouvrir `EQ-001`.

5. **Upload d un document technique**
   - Ajouter un document texte ou PDF sur `EQ-001` (type `MANUEL_MACHINE`).
   - Verifier qu il apparait dans la liste des documents.

6. **Generation document IA equipement**
   - Lancer `Generer document IA` sur `EQ-001`.
   - Verifier un nouveau document de type IA dans la liste.

7. **Lecture / telechargement du document**
   - Ouvrir ou telecharger le document genere.
   - Montrer le contenu technique structure.

8. **RAG documentaire via backend securise**
   - Question: `Quels documents parlent de surchauffe moteur ?`
   - Verifier:
     - reponse non vide
     - `sources` presentes
     - noms de fichiers `.md` visibles

9. **Diagnostic IA**
   - Cas: `EQ-001` + `Le moteur chauffe apres 20 minutes de fonctionnement.`
   - Verifier:
     - `diagnosis`
     - `recommendedActions`
     - `sources`

10. **Maintenance predictive**
    - Montrer tableau des risques (`/api/predictive/equipments/risk`).
    - Ouvrir le detail risque pour `EQ-001`.

11. **Predictive + RAG**
    - Lancer `rag-analysis` pour `EQ-001`.
    - Montrer:
      - score + raisons
      - analyse RAG contextuelle
      - sources documentaires

12. **Perspective DevOps cloud-native**
    - Montrer que la base Kubernetes est prete dans `k8s/`.
    - Montrer le chart Helm dans `helm/gmao/`.

13. **Arret propre**
    - Executer `stop-gmao.bat`.

## 5) Questions IA a poser (pretes)
- `Quels documents parlent de surchauffe moteur ?`
- `Quelle est la procedure de diagnostic en cas de surchauffe moteur sur EQ-001 ?`
- `Quels sont les problemes possibles sur le convoyeur EQ-002 ?`
- `Le moteur chauffe apres 20 minutes de fonctionnement.` (diagnosis)

## 6) Resultats attendus
- Login admin: OK (JWT genere)
- Sans token sur endpoint IA backend: 401
- Avec token: 200 sur `/api/ai/health`, `/api/ai/ask`, `/api/ai/diagnosis`
- RAG: reponse non vide + sources `.md`
- Diagnosis: `diagnosis` + `recommendedActions`
- Predictive: scores de risque + recommandations
- Predictive+RAG: score + raisons + analyse documentaire

## 7) Problemes possibles et solutions rapides
- **Frontend inaccessible sur 5173**
  - Relancer frontend avec host explicite:
    - `npm run dev -- --host 127.0.0.1 --port 5173`

- **Backend ne monte pas (8080 KO)**
  - Verifier MySQL local actif sur `3306`.
  - Relancer `mvn spring-boot:run` dans `backend/`.

- **Ollama KO / modele manquant**
  - `ollama serve`
  - `ollama pull qwen2.5:1.5b`

- **AI timeout ponctuel**
  - Rejouer la requete une 2e fois (warm-up modele)
  - Verifier `http://127.0.0.1:8000/health`

- **401 sur endpoints backend**
  - Refaire login et reutiliser un token valide

- **Upload document refuse**
  - Utiliser un format autorise: `pdf`, `txt`, `md`, `jpg`, `png`, `doc`, `docx`

## 8) Phrase courte pour la perspective Kubernetes
La version locale valide le fonctionnel metier, et la base `k8s + Helm` deja preparee permet une transition propre vers un deploiement cloud-native industrialisable.
