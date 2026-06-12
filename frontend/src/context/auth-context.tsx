import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUserProfileRequest, loginRequest } from "@/services/auth-service";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  setApiAuthErrorHandler,
  toApiHttpError,
} from "@/services/api";
import type { AppRole, AuthSession, AuthUser, LoginCredentials } from "@/types/auth";

const AUTH_USER_STORAGE_KEY = "gmao_auth_user";

interface AuthContextValue {
  isAuthenticated: boolean;
  isProfileLoading: boolean;
  user: AuthUser | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: readonly AppRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  const storedUser = sessionStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

function readStoredSession(): AuthSession | null {
  const storedToken = getAccessToken();
  if (!storedToken) {
    return null;
  }

  return {
    token: storedToken,
    user: readStoredUser() ?? { roles: [] },
  };
}

function persistSession(session: AuthSession): void {
  setAccessToken(session.token);
  sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
}

function clearSessionStorage(): void {
  clearAccessToken();
  sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

function normalizeRole(role: AppRole): string {
  const normalizedRole = role.trim().replaceAll(" ", "_").toUpperCase();
  return normalizedRole.startsWith("ROLE_") ? normalizedRole.slice(5) : normalizedRole;
}

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession);
  const [isProfileLoading, setIsProfileLoading] = useState(Boolean(getAccessToken()));

  const clearLocalSession = () => {
    setSession(null);
    clearSessionStorage();
  };

  const updateSessionWithProfile = (token: string, user: AuthUser) => {
    const nextSession: AuthSession = { token, user };
    setSession(nextSession);
    persistSession(nextSession);
  };

  useEffect(() => {
    let isMounted = true;
    const storedToken = getAccessToken();

    if (!storedToken) {
      setIsProfileLoading(false);
      return () => {
        isMounted = false;
      };
    }

    void (async () => {
      setIsProfileLoading(true);

      try {
        const profile = await getCurrentUserProfileRequest();
        if (!isMounted) {
          return;
        }

        updateSessionWithProfile(storedToken, profile);
      } catch {
        if (!isMounted) {
          return;
        }

        clearLocalSession();
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setApiAuthErrorHandler((status) => {
      if (status === 401) {
        clearLocalSession();
      }
    });

    return () => {
      setApiAuthErrorHandler(null);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const loginSession = await loginRequest(credentials);
      setSession(loginSession);
      persistSession(loginSession);

      setIsProfileLoading(true);
      const profile = await getCurrentUserProfileRequest();
      updateSessionWithProfile(loginSession.token, profile);
    } catch (error) {
      clearLocalSession();
      throw toApiHttpError(error, "Login impossible. Verifiez vos identifiants.");
    } finally {
      setIsProfileLoading(false);
    }
  };

  const logout = () => {
    clearLocalSession();
  };

  const hasRole = (role: AppRole): boolean => {
    const normalizedRole = normalizeRole(role);
    return (session?.user.roles ?? []).some((userRole) => normalizeRole(userRole) === normalizedRole);
  };

  const hasAnyRole = (roles: readonly AppRole[]): boolean => {
    if (roles.length === 0) {
      return true;
    }

    return roles.some((role) => hasRole(role));
  };

  const value: AuthContextValue = {
    isAuthenticated: Boolean(session?.token),
    isProfileLoading,
    user: session?.user ?? null,
    token: session?.token ?? null,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthContextProvider");
  }
  return context;
}
