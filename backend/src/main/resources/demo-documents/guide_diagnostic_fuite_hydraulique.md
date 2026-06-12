---
document_id: DOC-GUIDE-HYD-003
type_document: guide_diagnostic
equipements:
  - EQ-001
  - EQ-004
references_gmao:
  - "Fuite hydraulique"
  - "BreakdownType: HYDRAULIC"
version: "1.0"
date_revision: "2026-05-15"
mots_cles:
  - fuite hydraulique
  - pression
  - joint
  - étanchéité
  - pompe
usage_rag:
  - aide diagnostic détaillée
  - support maintenance corrective
---

# Guide de diagnostic - Fuite hydraulique

## Équipement concerné
- Équipements cibles: `EQ-001` (presse hydraulique), `EQ-004` (pompe centrifuge associée au circuit process).
- Applicabilité élargie aux circuits hydrauliques sous pression moyenne et haute.

## Symptômes observables
- Présence de film d'huile sur raccords, flexibles ou collecteurs.
- Baisse de pression lors des phases actives.
- Allongement du temps de cycle machine.
- Chute progressive du niveau d'huile dans le réservoir.

## Causes probables
- Vieillissement des joints haute pression.
- Serrage insuffisant d'un raccord après vibration prolongée.
- Fissuration d'un flexible à proximité d'un point chaud.
- Usure interne de pompe induisant des pertes de rendement.
- Contamination particulaire accélérant l'usure des surfaces d'étanchéité.

## Procédure de diagnostic
1. Isoler la machine et stabiliser le circuit à pression nulle.
2. Nettoyer la zone pour éliminer les traces historiques d'huile.
3. Monter progressivement en pression et observer les points sensibles.
4. Identifier la fuite (suintement, goutte à goutte, jet) et quantifier le débit perdu.
5. Contrôler l'état des flexibles, joints et brides de fixation.
6. Vérifier le différentiel de pression sur le filtre hydraulique.
7. Documenter l'origine de fuite dans l'OT avec localisation précise.

## Actions correctives
- Remplacer immédiatement les joints dégradés.
- Reposer ou remplacer les flexibles présentant craquelure ou écrasement.
- Procéder à une vidange/filtration si contamination particulaire confirmée.
- Contrôler et, si nécessaire, remplacer la tête de pompe.
- Réaliser un essai d'étanchéité de validation avant remise en exploitation.

## Pièces recommandées
- `SP-003` - Joint haute pression.
- `SP-001` - Filtre hydraulique.
- `SP-015` - Tête de pompe.
- `SP-009` - Électrovanne (si fuite pilotée liée à la commande).
- `SP-016` - Sonde pression.

## Consignes de sécurité
- Ne jamais rechercher une fuite à la main sur un circuit sous pression.
- Utiliser un écran de protection faciale contre les projections.
- Collecter et traiter les effluents selon la procédure environnementale.
- Vérifier la conformité des couples de serrage à la remise en route.

## Informations utiles pour un assistant RAG
- Questions typiques:
  - "Comment diagnostiquer une fuite hydraulique sur presse industrielle ?"
  - "Quelles pièces sortir du stock pour une fuite sous pression ?"
- Champs à indexer en priorité:
  - `failure_mode=fuite hydraulique`
  - `diagnostic_steps=7`
  - `spare_parts=[SP-003, SP-001, SP-015, SP-009, SP-016]`
- Réponse RAG attendue:
  - Prioriser la sécurité, puis la localisation, puis la correction et la validation.
