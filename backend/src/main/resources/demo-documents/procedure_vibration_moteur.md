---
document_id: DOC-PROC-VIB-005
type_document: procedure_panne
equipements:
  - EQ-006
  - EQ-012
  - EQ-001
references_gmao:
  - "Vibration excessive"
  - "BreakdownType: MECHANICAL"
version: "1.0"
date_revision: "2026-05-15"
mots_cles:
  - vibration moteur
  - roulement
  - alignement
  - analyse vibratoire
usage_rag:
  - diagnostic vibration
  - aide décisionnelle maintenance
---

# Procédure standard - Vibration moteur excessive

## Équipement concerné
- Applicabilité directe: `EQ-006`, `EQ-012`.
- Applicabilité complémentaire: équipements entraînés de `EQ-001`.

## Symptômes observables
- Hausse du niveau vibratoire mesuré sur paliers.
- Bruit mécanique cyclique à fréquence stable.
- Dégradation de qualité de process sous charge.
- Desserrage récurrent de fixations.

## Causes probables
- Désalignement arbre moteur / organe entraîné.
- Usure de roulements ou défaut de lubrification.
- Balourd rotor ou encrassement non homogène.
- Souplesse excessive du support (ancrage insuffisant).
- Résonance structurelle à vitesse de service.

## Procédure de diagnostic
1. Mesurer vibration globale RMS sur les trois axes.
2. Analyser le spectre fréquentiel pour discriminer balourd, désalignement, roulement.
3. Contrôler la température des paliers et la qualité du lubrifiant.
4. Vérifier le couple de serrage des fixations moteur.
5. Contrôler la géométrie d'alignement (laser ou comparateur).
6. Vérifier la stabilité vibratoire après réglage.

## Actions correctives
- Corriger l'alignement mécanique selon les tolérances.
- Remplacer les roulements présentant signature vibratoire dégradée.
- Rééquilibrer le rotor si balourd confirmé.
- Renforcer les ancrages et traiter les causes de résonance.
- Planifier une surveillance vibratoire renforcée sur 2 à 4 semaines.

## Pièces recommandées
- `SP-005` - Roulement moteur.
- `SP-025` - Capteur vibration.
- `SP-022` - Lubrifiant industriel 5L.
- `SP-029` - Capot ventilateur (si turbulence mécanique interne).

## Consignes de sécurité
- Arrêt et consignation obligatoires avant intervention mécanique.
- Respect de la zone d'exclusion autour des éléments tournants.
- Utilisation de protections auditives lors des mesures en marche.
- Validation par double contrôle avant remise en service.

## Informations utiles pour un assistant RAG
- Requêtes cibles:
  - "Procédure vibration moteur"
  - "Comment distinguer balourd et désalignement ?"
- Entités métier:
  - `failure_mode=vibration excessive`
  - `measurements=[RMS, spectre fréquentiel, température palier]`
  - `spare_parts=[SP-005, SP-025, SP-022, SP-029]`
- Règle de synthèse RAG:
  - Répondre avec diagnostic progressif (mesure -> interprétation -> action).
