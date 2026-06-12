export interface AiSource {
  file: string;
  snippet: string;
}

export interface AiHealthResponse {
  status: string;
  service: string;
  model: string;
}

export interface AiAskRequest {
  question: string;
  equipmentCode?: string;
}

export interface AiAskResponse {
  answer: string;
  sources: AiSource[];
}

export interface AiDiagnosisRequest {
  equipmentCode: string;
  breakdownDescription: string;
}

export interface AiDiagnosisResponse {
  diagnosis: string;
  recommendedActions: string[];
  sources: AiSource[];
}
