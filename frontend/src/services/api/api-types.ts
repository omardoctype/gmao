import type { AxiosRequestConfig } from "axios";
import type { ApiResponseEnvelope } from "@/types/api";

export type RequestConfig<TBody = unknown> = AxiosRequestConfig<TBody>;

export interface ApiResponseContext {
  status: number;
  requestUrl?: string;
}

export type ApiPayload<T> = T | ApiResponseEnvelope<T>;
