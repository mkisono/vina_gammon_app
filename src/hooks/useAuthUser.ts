import { useEffect, useRef, useState } from "react";
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

// グローバルキャッシュ: Cognito グループ情報を保持
let cached_isAdmin: boolean | null = null;
let cached_timestamp = 0;
const CACHE_DURATION_MS = 60000; // 60秒間キャッシュ

export function useAuthUser(): UseAuthUserReturn {
  const [isAdmin, setIsAdmin] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // 初期化済みまたは既にロード中の場合はスキップ
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    const loadRole = async () => {
      const now = Date.now();
      
      // キャッシュが有効な場合は使用
      if (cached_isAdmin !== null && now - cached_timestamp < CACHE_DURATION_MS) {
        setIsAdmin(cached_isAdmin);
        return;
      }

      try {
        // キャッシュを使用（forceRefresh: false またはデフォルト）
        const session = await fetchAuthSession();
        const accessGroups = getGroupsFromTokenClaim(
          session.tokens?.accessToken.payload["cognito:groups"]
        );
        const idGroups = getGroupsFromTokenClaim(session.tokens?.idToken?.payload["cognito:groups"]);
        const groups = [...new Set([...accessGroups, ...idGroups])];
        const admin = groups.includes("ADMIN");
        
        // キャッシュを更新
        cached_isAdmin = admin;
        cached_timestamp = now;

        setIsAdmin(admin);
      } catch {
        setIsAdmin(false);
      }
    };

    loadRole();
  }, []);

  return { isAdmin };
}
