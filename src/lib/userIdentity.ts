export const IDENTITY_TYPE_COGNITO_USER = "cognito_user";
export const IDENTITY_TYPE_ADMIN_MANAGED = "admin_managed";

export type IdentityType =
  | typeof IDENTITY_TYPE_COGNITO_USER
  | typeof IDENTITY_TYPE_ADMIN_MANAGED;

// Backward compatibility for existing records that do not have identityType.
export const normalizeIdentityType = (
  identityType: string | null | undefined,
): IdentityType => {
  return identityType === IDENTITY_TYPE_ADMIN_MANAGED
    ? IDENTITY_TYPE_ADMIN_MANAGED
    : IDENTITY_TYPE_COGNITO_USER;
};

export const createAdminManagedUserId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const ts = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 18).padEnd(16, "0");
  return `managed-${ts}-${rand}`;
};
