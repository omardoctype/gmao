---
document_id: DOC-RAPPORT-EQ001-OT0008-007
type_document: rapport_intervention
equipements:
  - EQ-001
references_gmao:
  - "Référence documentaire atelier: OT-0008"
  - "Correspondance GMAO seedée: WO-023 / BRK-023"
version: "1.0"
date_revision: "2026-05-15"
mots_cles:
  - rapport intervention
  - EQ-001
  - corrective
  - historique maintenance
usage_rag:
  - réponse factuelle historique
  - génération de synthèse intervention
---

# Rapport d'intervention - EQ-001 (OT-0008 documentaire)

## Équipement concerné
- Code équipement: `EQ-001`
- Désignation: Presse hydraulique HP-200
- Référence de suivi atelier: `OT-0008` (codification documentaire locale)
- Correspondance base seedée: `WO-023` lié à `BRK-023`

## Symptômes observables
- Bruit mécanique croissant en phase de montée en pression.
- Vibrations perçues sur le bloc moteur après 15 minutes d'exploitation.
- Légère dérive de cadence sur les cycles longs.

## Causes probables
- Début d'usure de roulement moteur.
- Désalignement mineur induit par les vibrations récurrentes.
- Lubrification insuffisante sur période d'exploitation continue.

## Procédure de diagnostic
1. Consultation de l'historique panne/OT sur `EQ-001`.
2. Mesure vibratoire sur les trois axes du moteur principal.
3. Contrôle thermique des paliers après palier de charge.
4. Vérification mécanique des fixations et de l'alignement.
5. Validation conjointe maintenance/opération avant action corrective.

## Actions correctives
- Remplacement préventif du roulement le plus sollicité.
- Reprise de l'alignement moteur.
- Complément de lubrification et contrôle des points d'injection.
- Essai de validation sur 30 cycles successifs.

## Pièces recommandées
- `SP-005` - Roulement moteur.
- `SP-022` - Lubrifiant industriel 5L.
- `SP-025` - Capteur vibration (surveillance renforcée post-intervention).

## Consignes de sécurité
- Consignation énergétique complète avant démontage.
- Interdiction de redémarrage sans confirmation du responsable maintenance.
- Contrôle d'absence d'outillage résiduel avant remise en service.
- Signature croisée du compte rendu de sécurité.

## Informations utiles pour un assistant RAG
- Nature documentaire:
  - Rapport historique semi-structuré avec lien explicite vers OT GMAO.
- Questions cibles:
  - "Quel historique d'intervention existe sur EQ-001 ?"
  - "Quelles actions ont été réalisées pour une vibration sur presse HP-200 ?"
- Entités de référence:
  - `equipment_code=EQ-001`
  - `document_ot_ref=OT-0008`
  - `work_order_ref=WO-023`
  - `breakdown_ref=BRK-023`
  - `status_context=IN_PROGRESS (seed)`
- Valeur RAG:
  - Sert de preuve narrative pour expliquer la continuité entre symptôme, diagnostic et action.
