import { apiClient, apiDeleteData, apiGetData, apiPostData } from "@/services/api";
import type { EquipmentDocument, EquipmentDocumentType } from "@/types/equipment";

const EQUIPMENTS_API_BASE = "/api/equipments";

export interface EquipmentDocumentUploadPayload {
  file: File;
  documentType: EquipmentDocumentType;
  generatedByAi?: boolean;
}

export interface EquipmentDocumentFilePayload {
  blob: Blob;
  fileName: string;
  contentType: string;
}

function parseFileName(contentDispositionHeader: string | undefined, fallbackFileName: string): string {
  if (!contentDispositionHeader) {
    return fallbackFileName;
  }

  const utf8FileNameMatch = contentDispositionHeader.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8FileNameMatch?.[1]) {
    return decodeURIComponent(utf8FileNameMatch[1].trim().replace(/["']/g, ""));
  }

  const basicFileNameMatch = contentDispositionHeader.match(/filename=([^;]+)/i);
  if (basicFileNameMatch?.[1]) {
    return basicFileNameMatch[1].trim().replace(/["']/g, "");
  }

  return fallbackFileName;
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const fileUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = fileUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(fileUrl);
}

export function getEquipmentDocuments(equipmentId: number): Promise<EquipmentDocument[]> {
  return apiGetData<EquipmentDocument[]>(`${EQUIPMENTS_API_BASE}/${equipmentId}/documents`);
}

export async function uploadEquipmentDocument(
  equipmentId: number,
  payload: EquipmentDocumentUploadPayload,
): Promise<EquipmentDocument> {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("documentType", payload.documentType);
  formData.append("generatedByAi", String(payload.generatedByAi ?? false));

  return apiPostData<EquipmentDocument, FormData>(`${EQUIPMENTS_API_BASE}/${equipmentId}/documents`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export async function downloadEquipmentDocument(equipmentId: number, document: EquipmentDocument): Promise<void> {
  const payload = await fetchEquipmentDocumentFile(equipmentId, document);
  triggerBrowserDownload(payload.blob, payload.fileName);
}

export async function fetchEquipmentDocumentFile(
  equipmentId: number,
  document: EquipmentDocument,
): Promise<EquipmentDocumentFilePayload> {
  const endpoint = `${EQUIPMENTS_API_BASE}/${equipmentId}/documents/${document.id}/download`;
  const response = await apiClient.get<Blob>(endpoint, {
    responseType: "blob",
    headers: {
      Accept: document.contentType || "application/octet-stream",
    },
  });

  const fileName = parseFileName(response.headers["content-disposition"], document.originalFileName);
  const fileBlob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: document.contentType || "application/octet-stream" });

  return {
    blob: fileBlob,
    fileName,
    contentType: fileBlob.type || document.contentType || "application/octet-stream",
  };
}

export async function openEquipmentDocumentInNewTab(equipmentId: number, document: EquipmentDocument): Promise<void> {
  const openedWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!openedWindow) {
    throw new Error("Ouverture du nouvel onglet bloquee par le navigateur.");
  }

  try {
    const payload = await fetchEquipmentDocumentFile(equipmentId, document);
    const fileUrl = window.URL.createObjectURL(payload.blob);

    openedWindow.location.href = fileUrl;
    openedWindow.document.title = payload.fileName;

    setTimeout(() => {
      window.URL.revokeObjectURL(fileUrl);
    }, 120000);
  } catch (error) {
    openedWindow.close();
    throw error;
  }
}

export function deleteEquipmentDocument(equipmentId: number, documentId: number): Promise<null> {
  return apiDeleteData<null>(`${EQUIPMENTS_API_BASE}/${equipmentId}/documents/${documentId}`);
}

export function generateAiEquipmentDocument(equipmentId: number): Promise<EquipmentDocument> {
  return apiPostData<EquipmentDocument>(`${EQUIPMENTS_API_BASE}/${equipmentId}/documents/generate-ai`);
}
