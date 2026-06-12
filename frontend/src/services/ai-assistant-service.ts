import { apiGetData, apiPostData } from "@/services/api";
import { withDevRequestTiming } from "@/services/api/request-timing";
import type {
  AiAskRequest,
  AiAskResponse,
  AiDiagnosisRequest,
  AiDiagnosisResponse,
  AiHealthResponse,
} from "@/types/ai-assistant";

const AI_ASSISTANT_API_BASE = "/api/ai";
const AI_REQUEST_TIMEOUT_MS = 90_000;

export function getAiHealth(): Promise<AiHealthResponse> {
  return withDevRequestTiming("GET /api/ai/health", () =>
    apiGetData<AiHealthResponse>(`${AI_ASSISTANT_API_BASE}/health`),
  );
}

export function askAiAssistant(payload: AiAskRequest): Promise<AiAskResponse> {
  return withDevRequestTiming("POST /api/ai/ask", () =>
    apiPostData<AiAskResponse, AiAskRequest>(`${AI_ASSISTANT_API_BASE}/ask`, payload, {
      timeout: AI_REQUEST_TIMEOUT_MS,
    }),
  );
}

export function requestAiDiagnosis(payload: AiDiagnosisRequest): Promise<AiDiagnosisResponse> {
  return withDevRequestTiming("POST /api/ai/diagnosis", () =>
    apiPostData<AiDiagnosisResponse, AiDiagnosisRequest>(`${AI_ASSISTANT_API_BASE}/diagnosis`, payload, {
      timeout: AI_REQUEST_TIMEOUT_MS,
    }),
  );
}
