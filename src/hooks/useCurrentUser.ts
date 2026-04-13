import { useEffect, useRef, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

type UseCurrentUserReturn = {
  userId: string | null;
  email: string | null;
  isLoading: boolean;
};

// グローバルキャッシュ
let cachedUserId: string | null = null;
let cachedEmail: string | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 60000;

export function useCurrentUser(): UseCurrentUserReturn {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    const loadCurrentUser = async () => {
      const now = Date.now();

      // キャッシュが有効な場合は使用
      if (cachedUserId !== null && now - cacheTimestamp < CACHE_DURATION_MS) {
        setUserId(cachedUserId);
        setEmail(cachedEmail);
        setIsLoading(false);
        return;
      }

      try {
        const session = await fetchAuthSession();
        const sub = session.userSub;
        const email = session.tokens?.idToken?.payload?.email as string | undefined;

        if (sub) {
          cachedUserId = sub;
          cachedEmail = email || null;
          cacheTimestamp = now;
          setUserId(sub);
          setEmail(email || null);
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
