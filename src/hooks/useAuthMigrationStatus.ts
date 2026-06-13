import { useCallback, useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

type UseAuthMigrationStatusReturn = {
  isLoadingMigrationStatus: boolean;
  isMigrationStatusResolved: boolean;
  isPasswordMigrated: boolean;
  isPasskeyRegistered: boolean;
  lastPromptedAt: string | null;
  markPromptShown: () => Promise<void>;
  markPasswordMigrated: () => Promise<void>;
  markPasskeyRegistered: () => Promise<void>;
  refresh: () => Promise<void>;
};

type MigrationRecord = {
  userId: string;
  passwordMigratedAt?: string | null;
  passkeyRegisteredAt?: string | null;
  lastPromptedAt?: string | null;
};

const nowIso = (): string => new Date().toISOString();

export function useAuthMigrationStatus(userId: string | null): UseAuthMigrationStatusReturn {
  const [isLoadingMigrationStatus, setIsLoadingMigrationStatus] = useState(true);
  const [record, setRecord] = useState<MigrationRecord | null>(null);
  const [hasPersistedRecord, setHasPersistedRecord] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setRecord(null);
      setHasPersistedRecord(false);
      setIsLoadingMigrationStatus(false);
      setResolvedUserId(null);
      return;
    }

    setIsLoadingMigrationStatus(true);
    try {
      const res = await client.models.AuthMigrationStatus.get({ userId });
      setRecord(res.data ?? null);
      setHasPersistedRecord(Boolean(res.data));
    } catch {
      setRecord(null);
      setHasPersistedRecord(false);
    } finally {
      setIsLoadingMigrationStatus(false);
      setResolvedUserId(userId);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upsert = useCallback(
    async (patch: Omit<MigrationRecord, "userId">) => {
      if (!userId) {
        return;
      }

      const base = record ?? { userId };
      const next: MigrationRecord = {
        userId,
        passwordMigratedAt: base.passwordMigratedAt ?? null,
        passkeyRegisteredAt: base.passkeyRegisteredAt ?? null,
        lastPromptedAt: base.lastPromptedAt ?? null,
        ...patch,
      };

      if (hasPersistedRecord) {
        await client.models.AuthMigrationStatus.update({
          userId,
          passwordMigratedAt: next.passwordMigratedAt ?? undefined,
          passkeyRegisteredAt: next.passkeyRegisteredAt ?? undefined,
          lastPromptedAt: next.lastPromptedAt ?? undefined,
        });
      } else {
        await client.models.AuthMigrationStatus.create({
          userId,
          passwordMigratedAt: next.passwordMigratedAt ?? undefined,
          passkeyRegisteredAt: next.passkeyRegisteredAt ?? undefined,
          lastPromptedAt: next.lastPromptedAt ?? undefined,
        });
      }

      setRecord(next);
      setHasPersistedRecord(true);
      setResolvedUserId(userId);
    },
    [hasPersistedRecord, record, userId],
  );

  const isMigrationStatusResolved = userId === null || resolvedUserId === userId;

  const markPromptShown = useCallback(async () => {
    await upsert({ lastPromptedAt: nowIso() });
  }, [upsert]);

  const markPasswordMigrated = useCallback(async () => {
    await upsert({ passwordMigratedAt: nowIso() });
  }, [upsert]);

  const markPasskeyRegistered = useCallback(async () => {
    await upsert({ passkeyRegisteredAt: nowIso() });
  }, [upsert]);

  return useMemo(
    () => ({
      isLoadingMigrationStatus,
      isMigrationStatusResolved,
      isPasswordMigrated: Boolean(record?.passwordMigratedAt),
      isPasskeyRegistered: Boolean(record?.passkeyRegisteredAt),
      lastPromptedAt: record?.lastPromptedAt ?? null,
      markPromptShown,
      markPasswordMigrated,
      markPasskeyRegistered,
      refresh,
    }),
    [
      isLoadingMigrationStatus,
      isMigrationStatusResolved,
      record,
      markPromptShown,
      markPasswordMigrated,
      markPasskeyRegistered,
      refresh,
    ],
  );
}
