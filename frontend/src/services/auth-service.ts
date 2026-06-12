import { apiGetData, apiPost } from "@/services/api";
import type { AppRole, AuthMeResponse, AuthSession, AuthUser, LoginCredentials } from "@/types/auth";

type UnknownRecord = Record<string, unknown>;

const TOKEN_KEYS = ["token", "accessToken", "jwt", "jwtToken"];
const ROLE_KEYS = ["roles", "authorities", "role"];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asRecord(value: unknown): UnknownRecord | null {
  return isRecord(value) ? value : null;
}

function normalizeRoleName(value: string): AppRole {
  const normalizedRole = value.trim().replaceAll(" ", "_").toUpperCase();
  return normalizedRole.startsWith("ROLE_") ? normalizedRole.slice(5) : normalizedRole;
}

function decodeBase64Url(value: string): string {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

function decodeJwtPayload(token: string): UnknownRecord | null {
  const tokenParts = token.split(".");
  if (tokenParts.length < 2) {
    return null;
  }

  try {
    const decoded = decodeBase64Url(tokenParts[1]);
    const parsed = JSON.parse(decoded) as unknown;
    return asRecord(parsed);
  } catch {
    return null;
  }
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readIdentifier(value: unknown): string | number | undefined {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  return undefined;
}

function normalizeRoles(value: unknown): AppRole[] {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((role) => normalizeRoleName(role))
      .filter((role) => role.length > 0);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const roles = value
    .map((entry) => {
      if (typeof entry === "string") {
        return normalizeRoleName(entry);
      }

      const entryRecord = asRecord(entry);
      if (!entryRecord) {
        return undefined;
      }

      const roleValue =
        readString(entryRecord.name) ?? readString(entryRecord.role) ?? readString(entryRecord.authority);

      return roleValue ? normalizeRoleName(roleValue) : undefined;
    })
    .filter((role): role is AppRole => Boolean(role));

  return Array.from(new Set(roles));
}

function extractToken(payload: UnknownRecord): string | null {
  for (const key of TOKEN_KEYS) {
    const token = readString(payload[key]);
    if (token) {
      return token;
    }
  }

  const nestedData = asRecord(payload.data);
  if (!nestedData) {
    return null;
  }

  for (const key of TOKEN_KEYS) {
    const token = readString(nestedData[key]);
    if (token) {
      return token;
    }
  }

  return null;
}

function extractRolesFromPayload(payload: UnknownRecord, userPayload: UnknownRecord | null, jwtPayload: UnknownRecord | null): AppRole[] {
  const rolesFromRoot = ROLE_KEYS.flatMap((key) => normalizeRoles(payload[key]));
  const rolesFromUser = userPayload ? ROLE_KEYS.flatMap((key) => normalizeRoles(userPayload[key])) : [];
  const rolesFromJwt = jwtPayload ? ROLE_KEYS.flatMap((key) => normalizeRoles(jwtPayload[key])) : [];

  return Array.from(new Set([...rolesFromRoot, ...rolesFromUser, ...rolesFromJwt]));
}

function extractUserPayload(payload: UnknownRecord): UnknownRecord | null {
  const userFromRoot = asRecord(payload.user);
  if (userFromRoot) {
    return userFromRoot;
  }

  const nestedData = asRecord(payload.data);
  if (!nestedData) {
    return null;
  }

  return asRecord(nestedData.user);
}

function buildAuthUser(payload: UnknownRecord, jwtPayload: UnknownRecord | null, roles: AppRole[]): AuthUser {
  const userPayload = extractUserPayload(payload);
  const id =
    readIdentifier(userPayload?.id) ?? readIdentifier(payload.id) ?? readIdentifier(jwtPayload?.userId) ?? readIdentifier(jwtPayload?.id);
  const firstName = readString(userPayload?.firstName) ?? readString(payload.firstName) ?? readString(jwtPayload?.firstName);
  const lastName = readString(userPayload?.lastName) ?? readString(payload.lastName) ?? readString(jwtPayload?.lastName);
  const email =
    readString(userPayload?.email) ??
    readString(payload.email) ??
    readString(jwtPayload?.email) ??
    readString(jwtPayload?.sub);

  return {
    id,
    firstName,
    lastName,
    email,
    roles,
  };
}

export function normalizeAuthSession(payload: unknown): AuthSession {
  const rootPayload = asRecord(payload);
  if (!rootPayload) {
    throw new Error("Reponse de login invalide.");
  }

  const token = extractToken(rootPayload);
  if (!token) {
    throw new Error("Token JWT absent dans la reponse de login.");
  }

  const jwtPayload = decodeJwtPayload(token);
  const userPayload = extractUserPayload(rootPayload);
  const roles = extractRolesFromPayload(rootPayload, userPayload, jwtPayload);
  const user = buildAuthUser(rootPayload, jwtPayload, roles);

  return {
    token,
    user,
  };
}

export async function loginRequest(credentials: LoginCredentials): Promise<AuthSession> {
  const payload = await apiPost<unknown, LoginCredentials>("/api/auth/login", credentials);
  return normalizeAuthSession(payload);
}

function mapAuthMeResponseToAuthUser(profile: AuthMeResponse): AuthUser {
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    active: profile.active,
    roles: normalizeRoles(profile.roles),
  };
}

export async function getCurrentUserProfileRequest(): Promise<AuthUser> {
  const profile = await apiGetData<AuthMeResponse>("/api/auth/me");
  return mapAuthMeResponseToAuthUser(profile);
}
