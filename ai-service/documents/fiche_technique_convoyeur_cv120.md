---
document_id: DOC-EQ002-FICHE-004
type_document: fiche_technique
equipements:
  - EQ-002
references_gmao:
  - "Convoyeur a bande CV-120"
  - "Ligne Emballage"
version: "1.0"
date_revision: "2026-05-15"
mots_cles:
  - convoyeur
  - CV-120
  - bande
  - transmission
  - blocage convoyeur
usage_rag:
  - réponses techniques équipement
  - assistance préparation intervention
---

# Fiche technique - Convoyeur à bande CV-120 (EQ-002)

## Équipement concerné
- Code: `EQ-002`
- Désignation: Convoyeur à bande CV-120
- Catégorie: Material Handling
- Marque / modèle: Convex CV-120
- Zone: Ligne Emballage

## Symptômes observables
- Dérive latérale de bande.
- Patinage au démarrage en charge.
- Blocages intermittents en zone de transfert.
- Vibration et bruit anormaux sur les rouleaux de tête.

## Causes probables
- Tension de bande incorrecte.
- Usure des rouleaux et des paliers.
- Encrassement des galets de retour.
- Désalignement mécanique après choc produit.
- Défaut de capteur de présence produit.

## Procédure de diagnostic
1. Vérifier l'absence de corps étrangers sur les chemins de bande.
2. Contrôler la tension et l'alignement selon la consigne constructeur.
3. Inspecter l'usure des rouleaux de tête et de queue.
4. Tester les capteurs de présence et les sécurités d'arrêt.
5. Relever la température des paliers après 20 minutes de fonctionnement.
6. Croiser les constats avec les OT correctifs ouverts sur `EQ-002`.

## Actions correctives
- Recentrer et retendre la bande selon les tolérances.
- Remplacer les rouleaux/paliers présentant échauffement ou jeu excessif.
- Nettoyer la zone de convoyage et sécuriser les zones de chute produit.
- Remplacer les capteurs défectueux et recalibrer la détection.
- Valider la stabilité sur un cycle de charge nominal complet.

## Pièces recommandées
- `SP-004` - Courroie convoyeur.
- `SP-005` - Roulement moteur.
- `SP-020` - Courroie crantée.
- `SP-025` - Capteur vibration.
- `SP-028` - Connecteur industriel (en cas de défaut de signal capteur).

## Consignes de sécurité
- Mettre en place la consignation mécanique et électrique avant réglage.
- Interdire tout réglage manuel bande en mouvement.
- Vérifier le bon fonctionnement des arrêts d'urgence avant redémarrage.
- Ne pas retirer les capots de protection en mode production.

## Informations utiles pour un assistant RAG
- Requêtes cibles:
  - "Fiche technique convoyeur CV-120"
  - "Comment traiter un blocage convoyeur EQ-002 ?"
- Entités indexables:
  - `equipment_code=EQ-002`
  - `failure_modes=[blocage convoyeur, vibration excessive]`
  - `spare_parts=[SP-004, SP-005, SP-020, SP-025, SP-028]`
- Utilisation recommandée dans le pipeline RAG:
  - Associer ce document aux tickets contenant les mots-clés "convoyeur", "bande", "blocage".
