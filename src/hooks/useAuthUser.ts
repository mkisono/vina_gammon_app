import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { getStringArrayClaim } from "./authClaims";

type UseAuthUserReturn = {
  isAdmin: boolean;
};

export function useAuthUser(): UseAuthUserReturn {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const session = await fetchAuthSession();
        const accessGroups = getStringArrayClaim(
          session.tokens?.accessToken.payload["cognito:groups"]
        );
        const idGroups = getStringArrayClaim(session.tokens?.idToken?.payload["cognito:groups"]);
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
