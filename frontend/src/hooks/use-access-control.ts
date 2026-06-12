import { useAuthContext } from "@/context/auth-context";
import {
  featureAccessControl,
  routeAccessControl,
  type FeatureAccessKey,
  type RouteAccessKey,
} from "@/routes/access-control";

export function useAccessControl() {
  const { hasAnyRole, hasRole, user } = useAuthContext();

  const canAccessRoute = (routeKey: RouteAccessKey): boolean => {
    return hasAnyRole(routeAccessControl[routeKey]);
  };

  const can = (featureKey: FeatureAccessKey): boolean => {
    return hasAnyRole(featureAccessControl[featureKey]);
  };

  const canAny = (featureKeys: readonly FeatureAccessKey[]): boolean => {
    return featureKeys.some((featureKey) => can(featureKey));
  };

  const canAll = (featureKeys: readonly FeatureAccessKey[]): boolean => {
    return featureKeys.every((featureKey) => can(featureKey));
  };

  return {
    roles: user?.roles ?? [],
    hasRole,
    hasAnyRole,
    canAccessRoute,
    can,
    canAny,
    canAll,
  };
}
