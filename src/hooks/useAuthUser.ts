import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

const getGroupsFromTokenClaim = (claim: unknown): string[] => {
  if (Array.isArray(claim)) {
    return claim.filter((v): v is string => typeof v === "string");
  }
  if (typeof claim === "string") {
    return [claim];
  }
  return [];
};

type UseAuthUserReturn = {
  isAdmin: boolean;
};

export function useAuthUser(): UseAuthUserReturn {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const session = await fetchAuthSession();
        const accessGroups = getGroupsFromTokenClaim(
          session.tokens?.accessToken.payload["cognito:groups"]
        );
        const idGroups = getGroupsFromTokenClaim(session.tokens?.idToken?.payload["cognito:groups"]);
        const groups = [...new Set([...accessGroups, ...idGroups])];
        const admin = groups.includes("ADMIN");

        setIsAdmin(admin);
      } catch {
        setIsAdmin(false);
      }
    };

    loadRole();
  }, []);

  return { isAdmin };
}
