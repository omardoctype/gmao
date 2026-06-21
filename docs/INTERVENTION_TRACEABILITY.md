# Traçabilité de l'intervention des ordres de travail

## Objectif

Suivre le cycle réel d'exécution d'un ordre de travail affecté à un technicien, depuis la prise en charge jusqu'à la clôture, puis comparer la durée estimée avec la durée réelle calculée côté serveur.

## Workflow

Le workflow opérationnel est :

`ASSIGNED -> ACCEPTED -> IN_PROGRESS -> COMPLETED`

- `ASSIGNED` : un responsable maintenance ou un administrateur affecte un technicien.
- `ACCEPTED` : le technicien affecté prend en charge l'ordre de travail.
- `IN_PROGRESS` : le technicien affecté démarre l'intervention.
- `COMPLETED` : le technicien affecté termine l'intervention avec le rapport terrain obligatoire.

Les statuts historiques `CREATED` et `CANCELLED` restent compatibles avec les flux existants.

## Horodatage

- `assignedAt` : renseigné automatiquement lors de l'affectation.
- `acceptedAt` : renseigné automatiquement lors de la prise en charge.
- `startedAt` : renseigné automatiquement lors du démarrage.
- `completedAt` : renseigné automatiquement lors de la clôture.

Les horodatages d'intervention ne sont pas écrasés après avoir été définis par les actions métier.

## Durées

- `estimatedDurationMinutes` : durée estimée en minutes, optionnelle, renseignée par `ADMIN` ou `RESPONSABLE_MAINTENANCE` dans les formulaires de création/modification.
- `actualDurationMinutes` : durée réelle calculée automatiquement à la clôture.
- Calcul : `completedAt - startedAt`, en minutes.
- Une durée négative est refusée.
- Le frontend ne peut pas envoyer `actualDurationMinutes`.

## Autorisation

- Seul le technicien affecté peut accepter un ordre de travail.
- Seul le technicien affecté peut démarrer une intervention.
- Seul le technicien affecté peut terminer une intervention avec rapport.
- `ADMIN` et `RESPONSABLE_MAINTENANCE` conservent les permissions de gestion, création, modification et affectation.
- Une action d'intervention sur un ordre affecté à un autre technicien retourne `403`.
- Une transition invalide retourne `409`.

## API

- `POST /api/work-orders/{id}/accept`
- `POST /api/work-orders/{id}/start`
- `POST /api/work-orders/{id}/complete`

Compatibilité conservée :

- `PATCH /api/work-orders/{id}/start`
- `PATCH /api/work-orders/{id}/close`
- `PATCH /api/work-orders/{id}/close-with-report`

La clôture avec rapport reste obligatoire dans le flux technicien.

## Audit et notifications

Audits ajoutés :

- prise en charge de l'ordre de travail ;
- démarrage de l'intervention ;
- clôture de l'intervention ;
- modification de la durée estimée ;
- calcul de la durée réelle.

Notifications idempotentes ajoutées pour :

- prise en charge ;
- démarrage ;
- clôture.

## UI

La fiche détail d'un ordre de travail affiche la section `Traçabilité de l'intervention` avec :

- timeline `ASSIGNED -> ACCEPTED -> IN_PROGRESS -> COMPLETED` ;
- technicien responsable ;
- date d'affectation ;
- date de prise en charge ;
- date de démarrage ;
- date de fin ;
- durée estimée ;
- durée réelle ;
- écart estimé / réel.

Les boutons contextuels sont visibles uniquement pour le technicien affecté :

- `Prendre en charge` sur `ASSIGNED` ;
- `Démarrer l'intervention` sur `ACCEPTED` ;
- `Terminer l'intervention` sur `IN_PROGRESS`.

## Tests

Scénarios couverts côté backend :

- acceptation par le technicien affecté ;
- démarrage après acceptation ;
- clôture avec rapport ;
- calcul de `actualDurationMinutes` ;
- refus si l'ordre est affecté à un autre technicien ;
- refus du démarrage avant acceptation ;
- refus de la clôture avant démarrage ;
- réponse `403` sur action non autorisée ;
- conservation du flux de clôture avec rapport d'intervention.

## Limites connues

- Aucun endpoint réel d'estimation IA de durée n'existe dans le backend ou le service IA actuel. L'interface garde donc uniquement le champ manuel `estimatedDurationMinutes`.
- Les fichiers SQL du projet sont conservés sous `backend/src/main/resources/db/sql`, mais l'application utilise encore `spring.jpa.hibernate.ddl-auto=update`. Le fichier `16_add_work_order_intervention_tracking.sql` sert de migration sûre et rejouable pour les bases existantes.
