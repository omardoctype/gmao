---
document_id: DOC-CATALOGUE-RAG-000
type_document: catalogue
equipements:
  - EQ-001
  - EQ-002
  - EQ-003
  - EQ-004
  - EQ-006
  - EQ-010
references_gmao:
  - "Corpus documentaire de démonstration"
version: "1.0"
date_revision: "2026-05-15"
mots_cles:
  - catalogue
  - indexation
  - RAG
usage_rag:
  - point d'entrée corpus
  - routage de requêtes
---

# Catalogue documentaire RAG - GMAO industrielle

## Équipement concerné
- Corpus multi-équipements, avec accent sur `EQ-001`, `EQ-002`, `EQ-003`.

## Symptômes observables
- N/A (document d'index du corpus).

## Causes probables
- N/A (document d'index du corpus).

## Procédure de diagnostic
1. Identifier l'intention de la requête utilisateur (diagnostic, sécurité, historique, pièces).
2. Filtrer les documents par `equipements`, `mots_cles` et `type_document`.
3. Prioriser les rapports d'intervention pour les questions historiques.
4. Prioriser procédures/guides pour les questions "comment faire".
5. Prioriser fiches/manuels pour les questions "caractéristiques équipement".

## Actions correctives
- Mettre à jour ce catalogue lorsqu'un nouveau document est ajouté.
- Conserver des identifiants stables (`document_id`) pour la traçabilité des réponses.

## Pièces recommandées
- N/A (ce document ne prescrit pas de pièce).

## Consignes de sécurité
- Toute réponse générée par RAG sur des interventions doit citer les sections sécurité des documents sources.
- En cas de conflit entre documents, appliquer la version la plus récente.

## Informations utiles pour un assistant RAG
- Documents du corpus:
  - `manuel_presse_hydraulique_hp200.md`
  - `procedure_surchauffe_moteur.md`
  - `guide_diagnostic_fuite_hydraulique.md`
  - `fiche_technique_convoyeur_cv120.md`
  - `procedure_vibration_moteur.md`
  - `guide_securite_intervention_electrique.md`
  - `rapport_intervention_eq001_ot0008.md`
  - `rapport_intervention_eq003_compresseur.md`
- Stratégie de chunking recommandée:
  - 1 chunk par section principale (`Symptômes`, `Causes`, `Procédure`, etc.).
- Format de citation conseillé:
  - `{document_id} - section - extrait synthétique`.
