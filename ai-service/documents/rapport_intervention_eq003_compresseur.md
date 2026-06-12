---
document_id: DOC-RAPPORT-EQ003-COMP-008
type_document: rapport_intervention
equipements:
  - EQ-003
references_gmao:
  - "Compresseur d'air CP-50"
  - "Correspondance GMAO seedée: WO-025 / BRK-025"
version: "1.0"
date_revision: "2026-05-15"
mots_cles:
  - compresseur
  - rapport intervention
  - débit insuffisant
  - maintenance corrective
usage_rag:
  - recherche de cas similaires
  - capitalisation du retour d'expérience
---

# Rapport d'intervention - Compresseur d'air CP-50 (EQ-003)

## Équipement concerné
- Code équipement: `EQ-003`
- Désignation: Compresseur d'air CP-50
- Localisation: Salle Utilités
- Correspondance base seedée: `WO-025` associé à `BRK-025`

## Symptômes observables
- Pression de service instable sur le réseau pneumatique.
- Diminution du débit lors des pics de consommation.
- Augmentation du temps de montée en pression après redémarrage.

## Causes probables
- Encrassement du filtre d'air en aspiration.
- Fatigue d'un organe de clapet et perte d'efficacité volumétrique.
- Micro-fuite sur électrovanne de régulation.
- Dérive de capteur de pression entraînant une régulation sous-optimale.

## Procédure de diagnostic
1. Vérifier les courbes de pression et les alarmes liées à `EQ-003`.
2. Contrôler les filtres d'air et la propreté des conduites.
3. Tester l'étanchéité des électrovannes et raccords sensibles.
4. Mesurer la pression réelle avec capteur externe de référence.
5. Valider la stabilité après ajustements sur charge simulée.

## Actions correctives
- Remplacement du filtre d'air principal.
- Remplacement de l'électrovanne présentant une fuite interne.
- Recalibrage du capteur de pression.
- Essai de performance sur séquence de production standard.
- Mise à jour du plan de surveillance hebdomadaire.

## Pièces recommandées
- `SP-023` - Filtre air compresseur.
- `SP-009` - Électrovanne.
- `SP-016` - Sonde pression.
- `SP-024` - Soupape sécurité.

## Consignes de sécurité
- Dépressuriser totalement la ligne avant déconnexion.
- Utiliser des protections auditives en phase de test en charge.
- Vérifier la compatibilité pression nominale des composants remplacés.
- Interdire les essais avec capotage ouvert.

## Informations utiles pour un assistant RAG
- Questions cibles:
  - "Quel retour d'expérience existe sur une perte de débit du compresseur EQ-003 ?"
  - "Quelles pièces recommander pour un compresseur CP-50 instable ?"
- Entités importantes:
  - `equipment_code=EQ-003`
  - `work_order_ref=WO-025`
  - `breakdown_ref=BRK-025`
  - `failure_mode=pression/debit insuffisant`
  - `spare_parts=[SP-023, SP-009, SP-016, SP-024]`
- Valeur pour le RAG:
  - Document idéal pour relier symptôme process (débit) et actions techniques validées.
