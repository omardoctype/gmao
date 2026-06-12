export interface ApiResponseEnvelope<T> {
  timestamp?: string;
  status: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  details?: Record<string, string> | string[] | string | null;
  data?: unknown;
  errors?: unknown;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  sort: string[];
}

export interface PageQueryParams {
  page?: number;
  size?: number;
  sort?: string;
}
