export type EquipmentStatus = "OPERATIONAL" | "MAINTENANCE" | "OUT_OF_SERVICE";

export type EquipmentCriticality = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Equipment {
  id: number;
  code: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  status: EquipmentStatus;
  criticality: EquipmentCriticality;
  installationDate: string | null;
  description: string | null;
}

export interface EquipmentPayload {
  code: string;
  name: string;
  category: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  location?: string | null;
  status: EquipmentStatus;
  criticality: EquipmentCriticality;
  installationDate?: string | null;
  description?: string | null;
}

export type EquipmentDocumentType =
  | "FICHE_TECHNIQUE"
  | "MANUEL_MACHINE"
  | "PHOTO"
  | "RAPPORT_INTERVENTION"
  | "AI_GENERATED_TECHNICAL_NOTE"
  | "DOCUMENT_GENERE_PAR_IA"
  | "AUTRE";

export interface EquipmentDocument {
  id: number;
  originalFileName: string;
  storedFileName: string;
  contentType: string;
  size: number;
  documentType: EquipmentDocumentType;
  storagePath: string;
  uploadedAt: string;
  generatedByAi: boolean;
}
