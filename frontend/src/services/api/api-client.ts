import axios from "axios";
import type { AxiosError } from "axios";
import { toApiHttpError } from "@/services/api/api-errors";
import { getAccessToken } from "@/services/api/token-store";
import type { ApiErrorResponse } from "@/types/api";

type AuthErrorStatus = 401 | 403;
type AuthErrorHandler = (status: AuthErrorStatus) => void;

let authErrorHandler: AuthErrorHandler | null = null;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setApiAuthErrorHandler(handler: AuthErrorHandler | null): void {
  authErrorHandler = handler;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? "";
    const isAuthLoginRequest = requestUrl.includes("/api/auth/login");

    if ((status === 401 || status === 403) && !isAuthLoginRequest && authErrorHandler) {
      authErrorHandler(status as AuthErrorStatus);
    }

    return Promise.reject(toApiHttpError(error));
  },
);
