import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/api";

type UnknownRecord = Record<string, unknown>;

export class ApiHttpError extends Error {
  status: number;
  details?: Record<string, string>;
  path?: string;
  raw?: unknown;

  constructor(
    message: string,
    status: number,
    details?: Record<string, string>,
    path?: string,
    raw?: unknown,
  ) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.details = details;
    this.path = path;
    this.raw = raw;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asRecord(value: unknown): UnknownRecord | null {
  return isRecord(value) ? value : null;
}

function normalizeDetails(details: unknown): Record<string, string> | undefined {
  if (!details) {
    return undefined;
  }

  if (typeof details === "string") {
    return { global: details };
  }

  if (Array.isArray(details)) {
    const mapped: Record<string, string> = {};
    details.forEach((entry, index) => {
      if (typeof entry === "string" && entry.trim().length > 0) {
        mapped[`error_${index + 1}`] = entry.trim();
      }
    });

    return Object.keys(mapped).length > 0 ? mapped : undefined;
  }

  if (!isRecord(details)) {
    return undefined;
  }

  const mappedEntries = Object.entries(details)
    .map(([key, value]) => {
      if (typeof value === "string" && value.trim().length > 0) {
        return [key, value.trim()] as const;
      }

      if (typeof value === "number" || typeof value === "boolean") {
        return [key, String(value)] as const;
      }

      return null;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry));

  return mappedEntries.length > 0 ? Object.fromEntries(mappedEntries) : undefined;
}

function extractPayload(raw: unknown): ApiErrorResponse | null {
  const directPayload = asRecord(raw);
  if (!directPayload) {
    return null;
  }

  const nestedData = asRecord(directPayload.data);
  const nestedError = asRecord(directPayload.error);

  if (typeof directPayload.message === "string" || typeof directPayload.error === "string") {
    return directPayload as ApiErrorResponse;
  }

  if (nestedData && (typeof nestedData.message === "string" || typeof nestedData.error === "string")) {
    return nestedData as ApiErrorResponse;
  }

  if (nestedError && (typeof nestedError.message === "string" || typeof nestedError.error === "string")) {
    return nestedError as ApiErrorResponse;
  }

  return directPayload as ApiErrorResponse;
}

function formatDetailsInline(details: Record<string, string>, maxItems = 2): string {
  return Object.entries(details)
    .slice(0, maxItems)
    .map(([field, message]) => `${field}: ${message}`)
    .join(" | ");
}

function isGenericValidationMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes("validation failed") || normalized.includes("invalid request");
}

function extractMessage(
  payload: ApiErrorResponse | null,
  axiosMessage: string | undefined,
  fallbackMessage: string,
  status: number,
  details?: Record<string, string>,
): string {
  const payloadMessage = typeof payload?.message === "string" ? payload.message.trim() : "";
  const payloadError = typeof payload?.error === "string" ? payload.error.trim() : "";
  const baseMessage = payloadMessage || payloadError || axiosMessage || fallbackMessage;

  if (details && Object.keys(details).length > 0 && (!baseMessage || isGenericValidationMessage(baseMessage))) {
    return formatDetailsInline(details, 2);
  }

  if (!baseMessage) {
    if (status === 401) {
      return "Authentification requise. Veuillez vous reconnecter.";
    }
    if (status === 403) {
      return "Acces refuse pour cette operation.";
    }
    if (status === 404) {
      return "Ressource introuvable.";
    }
    return fallbackMessage;
  }

  return baseMessage;
}

export function toApiHttpError(error: unknown, fallbackMessage = "Une erreur reseau est survenue."): ApiHttpError {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  const status = axiosError.response?.status ?? 0;
  const payload = extractPayload(axiosError.response?.data);
  const details = normalizeDetails(payload?.details ?? payload?.errors);
  const message = extractMessage(payload, axiosError.message, fallbackMessage, status, details);

  return new ApiHttpError(message, status, details, payload?.path, error);
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiHttpError) {
    return error.message;
  }

  return toApiHttpError(error, fallbackMessage).message;
}

export function getApiErrorDetails(error: unknown): Record<string, string> | undefined {
  if (error instanceof ApiHttpError) {
    return error.details;
  }

  return toApiHttpError(error).details;
}

export function getApiFieldError(error: unknown, field: string): string | undefined {
  return getApiErrorDetails(error)?.[field];
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiHttpError && error.status === 401;
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiHttpError && error.status === 403;
}

export function isTimeoutError(error: unknown): boolean {
  const timeoutRegex = /timeout|timed out/i;

  if (error instanceof ApiHttpError) {
    if (timeoutRegex.test(error.message)) {
      return true;
    }

    const raw = error.raw as { code?: string; message?: string; name?: string } | undefined;
    if (raw?.code === "ECONNABORTED") {
      return true;
    }
    if (typeof raw?.message === "string" && timeoutRegex.test(raw.message)) {
      return true;
    }
    if (raw?.name === "AbortError") {
      return true;
    }

    return false;
  }

  const genericError = error as { code?: string; message?: string; name?: string } | undefined;
  if (genericError?.code === "ECONNABORTED") {
    return true;
  }
  if (typeof genericError?.message === "string" && timeoutRegex.test(genericError.message)) {
    return true;
  }
  if (genericError?.name === "AbortError") {
    return true;
  }

  return false;
}
