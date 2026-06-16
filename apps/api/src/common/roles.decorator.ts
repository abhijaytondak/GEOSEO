import { SetMetadata } from "@nestjs/common";

/** Application roles, least → most privileged. Clerk org roles map onto these. */
export type AppRole = "viewer" | "analyst" | "marketer" | "admin" | "owner";

export const ROLES_KEY = "geoseo_roles";

/**
 * Restrict a route to a minimum set of roles (PRD §7.3). Opt-in: routes without
 * `@Roles(...)` are unaffected. A user passes if their (verified) role rank is ≥ the
 * lowest required role's rank.
 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
