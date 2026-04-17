import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { getStringClaim } from "./authClaims";

type UseCurrentUserReturn = {
  userId: string | null;
  email: string | null;
  isLoading: boolean;
};

export function useCurrentUser(): UseCurrentUserReturn {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const session = await fetchAuthSession();
        const sub = session.userSub;
        const email = getStringClaim(session.tokens?.idToken?.payload?.email);

        if (sub) {
          setUserId(sub);
          setEmail(email);
        } else {
          setUserId(null);
          setEmail(null);
        }
      } catch {
        setUserId(null);
        setEmail(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  return { userId, email, isLoading };
}
