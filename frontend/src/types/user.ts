export type UserRole =
  | "ADMIN"
  | "RESPONSABLE_MAINTENANCE"
  | "TECHNICIAN"
  | "STOREKEEPER"
  | "OPERATOR"
  | "DIRECTION";

export interface UserItem {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
  roles: UserRole[];
}

export interface UserCreatePayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string | null;
  active?: boolean;
  roles: UserRole[];
}

export interface UserUpdatePayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string | null;
  phone?: string | null;
  active: boolean;
  roles: UserRole[];
}

export interface UserRolesUpdatePayload {
  roles: UserRole[];
}
