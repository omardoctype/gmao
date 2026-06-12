import { apiGetData, apiPostData } from "@/services/api";
import { withDevRequestTiming } from "@/services/api/request-timing";
import type {
  PredictiveDashboardSummary,
  PredictiveRagAnalysisResponse,
  PredictiveRiskEquipment,
} from "@/types/predictive-maintenance";

const PREDICTIVE_API_BASE = "/api/predictive";
const PREDICTIVE_RAG_TIMEOUT_MS = 90_000;

export function getPredictiveRisks(): Promise<PredictiveRiskEquipment[]> {
  return apiGetData<PredictiveRiskEquipment[]>(`${PREDICTIVE_API_BASE}/equipments/risk`);
}

export function getPredictiveRiskByEquipmentId(equipmentId: number): Promise<PredictiveRiskEquipment> {
  return apiGetData<PredictiveRiskEquipment>(`${PREDICTIVE_API_BASE}/equipments/${equipmentId}/risk`);
}

export function getPredictiveDashboard(): Promise<PredictiveDashboardSummary> {
  return apiGetData<PredictiveDashboardSummary>(`${PREDICTIVE_API_BASE}/dashboard`);
}

export function getPredictiveRagAnalysis(equipmentId: number): Promise<PredictiveRagAnalysisResponse> {
  return withDevRequestTiming(`POST /api/predictive/equipments/${equipmentId}/rag-analysis`, () =>
    apiPostData<PredictiveRagAnalysisResponse>(
      `${PREDICTIVE_API_BASE}/equipments/${equipmentId}/rag-analysis`,
      undefined,
      {
        timeout: PREDICTIVE_RAG_TIMEOUT_MS,
      },
    ),
  );
}
