export type AppRole =
  | "ADMIN"
  | "RESPONSABLE_MAINTENANCE"
  | "TECHNICIAN"
  | "STOREKEEPER"
  | "OPERATOR"
  | "DIRECTION"
  | string;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  active?: boolean;
  roles: AppRole[];
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthMeResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  active: boolean;
  roles: string[];
}
