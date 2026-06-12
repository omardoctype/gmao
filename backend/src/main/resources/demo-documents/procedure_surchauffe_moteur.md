---
document_id: DOC-PROC-THERM-002
type_document: procedure_panne
equipements:
  - EQ-001
  - EQ-006
  - EQ-003
references_gmao:
  - "Surchauffe moteur"
  - "BreakdownType: ELECTRICAL"
version: "1.0"
date_revision: "2026-05-15"
mots_cles:
  - surchauffe moteur
  - moteur électrique
  - thermique
  - diagnostic
  - maintenance
usage_rag:
  - troubleshooting
  - recommandation d'actions
---

# Procédure standard - Surchauffe moteur

## Équipement concerné
- Équipements concernés en priorité: `EQ-001`, `EQ-006`, `EQ-003`.
- Applicabilité: tout entraînement moteur avec charge variable et ventilation forcée.

## Symptômes observables
- Alarme de température moteur ou arrêt intempestif.
- Odeur de vernis chauffé au voisinage du carter.
- Variation anormale du courant absorbé.
- Dégradation de performance sous charge continue.

## Causes probables
- Surcharge mécanique ou point dur sur l'organe entraîné.
- Ventilation insuffisante (ventilateur colmaté ou défaillant).
- Déséquilibre électrique d'alimentation.
- Défaut de lubrification des paliers et hausse de friction.
- Capteur thermique dérivant ou mal positionné.

## Procédure de diagnostic
1. Sécuriser l'installation et consigner la source d'énergie.
2. Relever la température carcasse et la comparer à la valeur nominale constructeur.
3. Mesurer tension, courant, facteur de puissance et déséquilibre entre phases.
4. Contrôler le débit d'air de refroidissement et l'état des ailettes.
5. Vérifier le niveau de lubrification et l'état des roulements.
6. Contrôler la cohérence des capteurs thermiques (mesure redondante).
7. Corréler les mesures avec les événements GMAO (pannes, OT, interventions).

## Actions correctives
- Réduire la charge le temps de stabiliser le comportement thermique.
- Remplacer les organes de ventilation défaillants.
- Rééquilibrer l'alimentation électrique en cas d'écart de phase.
- Remplacer les roulements présentant échauffement ou vibration anormale.
- Remplacer ou recalibrer le capteur de température.

## Pièces recommandées
- `SP-010` - Ventilateur moteur.
- `SP-005` - Roulement moteur.
- `SP-002` - Capteur température.
- `SP-006` - Fusible industriel (si événement de protection associé).
- `SP-007` - Disjoncteur (en cas de déclenchements répétés).

## Consignes de sécurité
- Consignation électrique obligatoire avant ouverture du bornier.
- Vérification d'absence de tension avant manipulation.
- Interdiction de toucher des surfaces potentiellement > 60°C sans protection.
- Respect des distances d'isolement et de l'outillage certifié.

## Informations utiles pour un assistant RAG
- Exemples de requêtes:
  - "Étapes de diagnostic d'une surchauffe moteur sur une machine industrielle"
  - "Quelles pièces prévoir pour traiter une surchauffe moteur ?"
- Entités extraites:
  - `failure_mode=surchauffe moteur`
  - `spare_parts=[SP-010, SP-005, SP-002, SP-006, SP-007]`
  - `risk_category=électrique/thermique`
- Logique de réponse recommandée:
  - Prioriser la sécurité.
  - Fournir une séquence diagnostic mesurable.
  - Terminer par une liste de pièces et un contrôle post-intervention.
