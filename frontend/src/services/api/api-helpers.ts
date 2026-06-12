import { apiClient } from "@/services/api/api-client";
import type { ApiPayload, RequestConfig } from "@/services/api/api-types";
import type { ApiResponseEnvelope } from "@/types/api";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isApiEnvelope<T>(payload: ApiPayload<T>): payload is ApiResponseEnvelope<T> {
  if (!isRecord(payload)) {
    return false;
  }

  if (!("data" in payload)) {
    return false;
  }

  return "status" in payload || "message" in payload || "timestamp" in payload;
}

export function unwrapApiData<T>(payload: ApiPayload<T>): T {
  if (isApiEnvelope(payload)) {
    return payload.data;
  }

  return payload;
}

export async function apiRequest<TResponse, TBody = unknown>(
  config: RequestConfig<TBody>,
  unwrapData = false,
): Promise<TResponse> {
  const response = await apiClient.request<ApiPayload<TResponse>, { data: ApiPayload<TResponse> }, TBody>(config);
  const payload = response.data;
  return (unwrapData ? unwrapApiData(payload) : payload) as TResponse;
}

export function apiGet<TResponse>(url: string, config?: RequestConfig): Promise<TResponse> {
  return apiRequest<TResponse>({ method: "GET", url, ...config });
}

export function apiGetData<TResponse>(url: string, config?: RequestConfig): Promise<TResponse> {
  return apiRequest<TResponse>({ method: "GET", url, ...config }, true);
}

export function apiPost<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: RequestConfig<TBody>,
): Promise<TResponse> {
  return apiRequest<TResponse, TBody>({ method: "POST", url, data: body, ...config });
}

export function apiPostData<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: RequestConfig<TBody>,
): Promise<TResponse> {
  return apiRequest<TResponse, TBody>({ method: "POST", url, data: body, ...config }, true);
}

export function apiPut<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: RequestConfig<TBody>,
): Promise<TResponse> {
  return apiRequest<TResponse, TBody>({ method: "PUT", url, data: body, ...config });
}

export function apiPutData<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: RequestConfig<TBody>,
): Promise<TResponse> {
  return apiRequest<TResponse, TBody>({ method: "PUT", url, data: body, ...config }, true);
}

export function apiPatch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: RequestConfig<TBody>,
): Promise<TResponse> {
  return apiRequest<TResponse, TBody>({ method: "PATCH", url, data: body, ...config });
}

export function apiPatchData<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: RequestConfig<TBody>,
): Promise<TResponse> {
  return apiRequest<TResponse, TBody>({ method: "PATCH", url, data: body, ...config }, true);
}

export function apiDelete<TResponse>(url: string, config?: RequestConfig): Promise<TResponse> {
  return apiRequest<TResponse>({ method: "DELETE", url, ...config });
}

export function apiDeleteData<TResponse>(url: string, config?: RequestConfig): Promise<TResponse> {
  return apiRequest<TResponse>({ method: "DELETE", url, ...config }, true);
}
