---
document_id: DOC-SEC-ELEC-006
type_document: guide_securite
equipements:
  - EQ-010
  - EQ-014
  - EQ-006
references_gmao:
  - "Court-circuit armoire"
  - "Intervention électrique"
version: "1.0"
date_revision: "2026-05-15"
mots_cles:
  - sécurité électrique
  - consignation
  - armoire électrique
  - LOTO
usage_rag:
  - recommandations sécurité
  - prérequis intervention
---

# Guide de sécurité - Intervention électrique industrielle

## Équipement concerné
- Armoires et alimentations associées à `EQ-010`, `EQ-014`, `EQ-006`.
- Extension possible à tout équipement avec puissance installée > 400 V.

## Symptômes observables
- Déclenchements répétés de disjoncteurs.
- Odeur de chauffe au niveau de l'armoire.
- Traces de carbonisation sur borniers ou câbles.
- Alarmes liées aux défauts d'isolement.

## Causes probables
- Court-circuit franc ou défaut d'isolement progressif.
- Couple de serrage insuffisant sur connexions de puissance.
- Vieillissement thermique des composants de protection.
- Infiltration d'humidité dans l'armoire.

## Procédure de diagnostic
1. Isoler la zone et empêcher toute remise sous tension non autorisée.
2. Appliquer la consignation LOTO complète (amont et aval).
3. Vérifier l'absence de tension avec appareil étalonné.
4. Inspecter visuellement les protections et l'état des borniers.
5. Mesurer l'isolement et la continuité des circuits critiques.
6. Identifier le composant défaillant puis qualifier la cause racine.

## Actions correctives
- Remplacer fusibles, disjoncteurs ou contacteurs non conformes.
- Refaire les connexions avec couples de serrage contrôlés.
- Assainir l'armoire (nettoyage, ventilation, étanchéité).
- Mettre à jour le schéma électrique si modification de câblage.
- Effectuer un test de remise en service encadré par un second intervenant.

## Pièces recommandées
- `SP-006` - Fusible industriel.
- `SP-007` - Disjoncteur.
- `SP-018` - Contacteur puissance.
- `SP-028` - Connecteur industriel.
- `SP-012` - Relais thermique.

## Consignes de sécurité
- Intervention réservée au personnel habilité électrique.
- Port obligatoire d'EPI arc flash adaptés au niveau de risque.
- Utilisation d'outils isolés et de tapis diélectriques.
- Interdiction absolue de court-circuiter un dispositif de protection.
- Traçabilité immédiate dans la GMAO de toute action de sécurisation.

## Informations utiles pour un assistant RAG
- Requêtes cibles:
  - "Consignes LOTO pour intervention armoire électrique"
  - "Que faire après un court-circuit sur équipement industriel ?"
- Entités à extraire:
  - `risk_type=électrique`
  - `mandatory_controls=[consignation, VAT, test isolement]`
  - `spare_parts=[SP-006, SP-007, SP-018, SP-028, SP-012]`
- Politique de réponse RAG:
  - Toujours commencer par les prérequis de sécurité avant toute action technique.
