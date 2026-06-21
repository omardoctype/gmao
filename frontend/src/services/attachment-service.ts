import { apiClient, apiDeleteData, apiGetData, apiPatchData, apiPostData } from "@/services/api";
import type { AttachmentCategory, AttachmentEntityType, MediaAttachment } from "@/types/attachment";

const ATTACHMENTS_API_BASE = "/api/attachments";

export const ATTACHMENT_MAX_FILES = 5;
export const ATTACHMENT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export interface AttachmentUploadPayload {
  entityType: AttachmentEntityType;
  entityId: number;
  category: AttachmentCategory;
  description?: string;
  displayOrder?: number;
  files: File[];
}

export interface AttachmentUpdatePayload {
  category?: AttachmentCategory;
  description?: string | null;
  displayOrder?: number;
}

export function formatAttachmentFileSize(sizeInBytes: number): string {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes < 0) {
    return "-";
  }

  const units = ["B", "KB", "MB", "GB"] as const;
  let value = sizeInBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 100 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export function formatAttachmentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function validateAttachmentFiles(files: File[]): string | null {
  if (files.length === 0) {
    return "Selectionnez au moins une image.";
  }

  if (files.length > ATTACHMENT_MAX_FILES) {
    return `Selectionnez ${ATTACHMENT_MAX_FILES} images maximum.`;
  }

  const allowedTypes = new Set<string>(ATTACHMENT_ALLOWED_MIME_TYPES);

  for (const file of files) {
    if (!allowedTypes.has(file.type)) {
      return "Seules les images JPEG, PNG et WebP sont acceptees.";
    }

    if (file.size > ATTACHMENT_MAX_FILE_SIZE_BYTES) {
      return "Chaque image doit faire 10 MB maximum.";
    }
  }

  return null;
}

export function getAttachments(entityType: AttachmentEntityType, entityId: number): Promise<MediaAttachment[]> {
  return apiGetData<MediaAttachment[]>(ATTACHMENTS_API_BASE, {
    params: {
      entityType,
      entityId,
    },
  });
}

export function getAttachment(id: number): Promise<MediaAttachment> {
  return apiGetData<MediaAttachment>(`${ATTACHMENTS_API_BASE}/${id}`);
}

export async function uploadAttachments(payload: AttachmentUploadPayload): Promise<MediaAttachment[]> {
  const formData = new FormData();
  formData.append("entityType", payload.entityType);
  formData.append("entityId", String(payload.entityId));
  formData.append("category", payload.category);

  if (payload.description?.trim()) {
    formData.append("description", payload.description.trim());
  }

  if (payload.displayOrder !== undefined) {
    formData.append("displayOrder", String(payload.displayOrder));
  }

  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  return apiPostData<MediaAttachment[], FormData>(ATTACHMENTS_API_BASE, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function fetchAttachmentContent(attachment: MediaAttachment): Promise<Blob> {
  const response = await apiClient.get<Blob>(`${ATTACHMENTS_API_BASE}/${attachment.id}/content`, {
    responseType: "blob",
    headers: {
      Accept: attachment.mimeType || "image/*",
    },
  });

  if (response.data instanceof Blob) {
    return response.data;
  }

  return new Blob([response.data], { type: attachment.mimeType || "application/octet-stream" });
}

export function updateAttachment(id: number, payload: AttachmentUpdatePayload): Promise<MediaAttachment> {
  return apiPatchData<MediaAttachment, AttachmentUpdatePayload>(`${ATTACHMENTS_API_BASE}/${id}`, payload);
}

export function deleteAttachment(id: number): Promise<null> {
  return apiDeleteData<null>(`${ATTACHMENTS_API_BASE}/${id}`);
}
