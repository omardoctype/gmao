---
document_id: DOC-EQ001-MANUEL-001
type_document: manuel_equipement
equipements:
  - EQ-001
references_gmao:
  - "Presse hydraulique HP-200"
  - "HydroTech"
  - "Atelier A"
version: "1.0"
date_revision: "2026-05-15"
mots_cles:
  - presse hydraulique
  - HP-200
  - fuite hydraulique
  - surchauffe moteur
  - maintenance corrective
usage_rag:
  - diagnostic guidé
  - assistance opérateur
  - recommandation de pièces
---

# Manuel opérationnel - Presse hydraulique HP-200 (EQ-001)

## Équipement concerné
- Code: `EQ-001`
- Désignation: Presse hydraulique HP-200
- Catégorie: Press
- Marque / modèle: HydroTech HP-200
- Localisation nominale: Atelier A

## Symptômes observables
- Montée progressive de la température moteur au-delà de la plage nominale.
- Diminution de la vitesse de cycle en phase de compression.
- Présence de traces d'huile sous le bloc de distribution hydraulique.
- Bruit intermittent de cavitation lors du démarrage à froid.

## Causes probables
- Encrassement du filtre hydraulique et baisse du débit utile.
- Usure des joints haute pression et micro-fuites internes.
- Défaut de refroidissement moteur (ventilation insuffisante).
- Dérive de capteur de température provoquant une régulation incorrecte.

## Procédure de diagnostic
1. Vérifier l'historique des alarmes thermiques dans la GMAO pour `EQ-001`.
2. Contrôler le niveau et la viscosité de l'huile hydraulique.
3. Relever la température moteur à charge partielle puis nominale.
4. Mesurer la pression amont/aval sur le circuit principal.
5. Inspecter visuellement les zones de jonction, flexibles et raccords.
6. Valider la cohérence du capteur de température avec un instrument étalon.

## Actions correctives
- Remplacer le filtre hydraulique si la perte de charge dépasse la tolérance.
- Remplacer les joints dégradés et refaire l'étanchéité des raccords.
- Nettoyer le circuit de ventilation moteur et tester le ventilateur.
- Recalibrer ou remplacer le capteur de température si dérive confirmée.
- Effectuer un essai de reprise de production sur trois cycles complets.

## Pièces recommandées
- `SP-001` - Filtre hydraulique.
- `SP-003` - Joint haute pression.
- `SP-010` - Ventilateur moteur.
- `SP-016` - Sonde pression.
- `SP-015` - Tête de pompe (si perte de rendement persistante).

## Consignes de sécurité
- Appliquer la procédure de consignation électrique et hydraulique (LOTO).
- Dépressuriser intégralement le circuit avant toute ouverture.
- Porter les EPI: gants anti-huile, lunettes, chaussures de sécurité, écran facial.
- Interdire toute intervention sous charge mécanique active de la presse.
- Réaliser un contrôle croisé avant remise en service.

## Informations utiles pour un assistant RAG
- Questions cibles:
  - "Pourquoi la presse HP-200 surchauffe-t-elle ?"
  - "Quelle procédure suivre en cas de fuite hydraulique sur EQ-001 ?"
  - "Quelles pièces stock recommander pour la presse hydraulique ?"
- Entités métier à extraire:
  - `equipment_code=EQ-001`
  - `failure_modes=[surchauffe moteur, fuite hydraulique]`
  - `spare_parts=[SP-001, SP-003, SP-010, SP-016, SP-015]`
- Passage de preuve prioritaire:
  - La section "Procédure de diagnostic" sert de réponse actionnable pas-à-pas.
- Stratégie d'indexation recommandée:
  - Découper par section (symptômes, causes, diagnostic, actions, sécurité).
  - Conserver le champ `document_id` comme identifiant de citation.
