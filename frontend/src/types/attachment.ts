export type AttachmentEntityType = "EQUIPMENT" | "BREAKDOWN" | "WORK_ORDER" | "INTERVENTION_REPORT";

export type AttachmentCategory =
  | "GENERAL"
  | "EQUIPMENT_PHOTO"
  | "NAMEPLATE"
  | "BREAKDOWN_PHOTO"
  | "BEFORE_INTERVENTION"
  | "AFTER_INTERVENTION"
  | "FINAL_REPORT_PHOTO";

export interface MediaAttachment {
  id: number;
  originalFileName: string;
  storedFileName: string;
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  uploadedById: number | null;
  uploadedByName: string | null;
  entityType: AttachmentEntityType;
  entityId: number;
  category: AttachmentCategory;
  description: string | null;
  displayOrder: number;
}

export interface AttachmentCategoryOption {
  value: AttachmentCategory;
  label: string;
}

export const ATTACHMENT_CATEGORY_LABELS: Record<AttachmentCategory, string> = {
  GENERAL: "General",
  EQUIPMENT_PHOTO: "Photo equipement",
  NAMEPLATE: "Plaque signaletique",
  BREAKDOWN_PHOTO: "Photo panne",
  BEFORE_INTERVENTION: "Avant intervention",
  AFTER_INTERVENTION: "Apres intervention",
  FINAL_REPORT_PHOTO: "Photo rapport final",
};
