export const getStringClaim = (claim: unknown): string | null => {
  return typeof claim === "string" ? claim : null;
};

export const getStringArrayClaim = (claim: unknown): string[] => {
  if (Array.isArray(claim)) {
    return claim.filter((value): value is string => typeof value === "string");
  }

  const singleValue = getStringClaim(claim);
  return singleValue ? [singleValue] : [];
};