# Attachments and Media

## Scope

The media attachment system stores secure image attachments for:

- `EQUIPMENT`
- `BREAKDOWN`
- `WORK_ORDER`
- `INTERVENTION_REPORT`

It is intentionally separate from the existing equipment document system. Existing `EquipmentDocument` records, download URLs, generated intervention-report Markdown documents, and storage paths remain unchanged.

## Data Model

The reusable backend entity is `MediaAttachment`, persisted in `media_attachments` by migration `17_create_media_attachments.sql`.

Core fields:

- `id`
- `original_file_name`
- `stored_file_name`
- `file_url`
- `mime_type`
- `file_size_bytes`
- `uploaded_at`
- `uploaded_by_id`
- `entity_type`
- `entity_id`
- `category`
- `description`
- `display_order`
- `storage_path`

Supported categories:

- `GENERAL`
- `EQUIPMENT_PHOTO`
- `NAMEPLATE`
- `BREAKDOWN_PHOTO`
- `BEFORE_INTERVENTION`
- `AFTER_INTERVENTION`
- `FINAL_REPORT_PHOTO`

`storage_path` is internal only. API responses expose metadata and the protected `fileUrl`, but not a physical filesystem path.

## Storage

Media files reuse the backend document storage configuration:

- Spring property: `app.documents.storage-dir`
- Env var: `APP_DOCUMENTS_STORAGE_DIR`
- Default: `uploads/equipment-documents`
- Media subdirectory: `<storage-dir>/media-attachments`

Docker Compose mounts `./backend/uploads:/app/uploads` and sets `APP_DOCUMENTS_STORAGE_DIR=/app/uploads/equipment-documents`, so media files land under:

```text
/app/uploads/equipment-documents/media-attachments
```

Kubernetes and Helm use the same backend uploads PVC mounted at `/app/uploads`:

- Raw manifests: `backend-uploads-pvc`
- Helm values: `backend.persistence.claimName=backend-uploads-pvc`
- Helm mount path: `backend.persistence.mountPath=/app/uploads`

## File Validation

Server-side validation is authoritative:

- Accepted MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Accepted extensions: `.jpg`, `.jpeg`, `.png`, `.webp`
- Max file size: 10 MB per file
- Max request batch: 5 files
- SVG and arbitrary documents are rejected
- Original filenames are sanitized and path traversal patterns are rejected
- Stored filenames are generated with UUID plus a validated extension
- File signatures are checked for JPEG, PNG, and WebP magic bytes

Frontend validation mirrors these limits for early feedback, but the backend repeats all checks.

## API

Base path: `/api/attachments`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/attachments` | Multipart upload of 1-5 image files |
| `GET` | `/api/attachments?entityType=&entityId=` | List metadata for a parent entity |
| `GET` | `/api/attachments/{id}` | Get metadata for one attachment |
| `GET` | `/api/attachments/{id}/content` | Stream protected image bytes |
| `PATCH` | `/api/attachments/{id}` | Update category, description, or display order |
| `DELETE` | `/api/attachments/{id}` | Delete metadata and physical file |

`/content` requires authentication. The frontend fetches blobs through `apiClient`, creates temporary object URLs, and revokes them after use.

## RBAC

Backend checks combine role and parent-entity access.

| Role | Permissions |
| --- | --- |
| `ADMIN` | Upload, view, update, delete all media |
| `RESPONSABLE_MAINTENANCE` | Upload, view, update, delete all maintenance media |
| `TECHNICIAN` | View/upload work-order media only for assigned work orders; view/upload intervention-report media when assigned or report technician |
| `OPERATOR` | Upload breakdown photos when declaring or editing pannes through existing breakdown rules; view only where parent access permits |
| `DIRECTION` | Metadata/content access only where parent view permission permits; no upload/delete |

Delete and update are restricted to managers/admins in `MediaAttachmentService`.

## Frontend

Reusable components live in `frontend/src/components/attachments`:

- `AttachmentUploader`
- `AttachmentGallery`
- `AttachmentCard`
- `AttachmentImagePreviewDialog`
- `AttachmentSection`

Frontend service and types:

- `frontend/src/services/attachment-service.ts`
- `frontend/src/types/attachment.ts`

Integrated surfaces:

- Equipment drawer: "Photos et documents" image gallery for equipment photos, nameplates, and general images. Existing equipment documents remain in the separate document section.
- Breakdown form/detail: breakdown photos can be selected during declaration/edit and shown in the breakdown detail gallery.
- Work order detail: before/after/general intervention proof gallery for assigned technician work.
- Intervention report close/detail: final photos can be selected while closing with a report, then shown from the saved intervention report detail block.

## Operational Notes

- Deleting an attachment removes DB metadata and then validates/removes the physical file.
- Upload/delete actions are audit logged as media attachment events.
- Existing equipment document migrations and data are not modified.
- The new SQL migration is numbered to follow the existing `backend/src/main/resources/db/sql` convention.
