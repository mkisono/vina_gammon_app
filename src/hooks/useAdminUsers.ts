import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import {
  createAdminManagedUserId,
  IDENTITY_TYPE_ADMIN_MANAGED,
  normalizeIdentityType,
} from "../lib/userIdentity";

const client = generateClient<Schema>();

const toNicknameKey = (nickname: string): string => nickname.trim().toLocaleLowerCase("ja-JP");

type AdminManagedUser = {
  userId: string;
  nickname: string;
  realName: string;
  identityType: "cognito_user" | "admin_managed";
  createdBy: string | null;
};

type UseAdminUsersReturn = {
  users: AdminManagedUser[];
  isLoadingUsers: boolean;
  isSavingUser: boolean;
  createAdminUser: (params: { nickname: string; realName: string; adminUserId: string }) => Promise<void>;
  updateAdminUser: (params: {
    userId: string;
    nickname: string;
    realName: string;
    adminUserId: string;
  }) => Promise<void>;
};

export function useAdminUsers(enabled = true): UseAdminUsersReturn {
  const [publicProfiles, setPublicProfiles] = useState<Array<Schema["PublicProfile"]["type"]>>([]);
  const [privateProfiles, setPrivateProfiles] = useState<Array<Schema["PrivateProfile"]["type"]>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSavingUser, setIsSavingUser] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setPublicProfiles([]);
      setPrivateProfiles([]);
      setIsLoadingUsers(false);
      return;
    }

    setIsLoadingUsers(true);

    const publicSub = client.models.PublicProfile.observeQuery().subscribe({
      next: ({ items }) => {
        setPublicProfiles([...items]);
        setIsLoadingUsers(false);
      },
    });

    const privateSub = client.models.PrivateProfile.observeQuery().subscribe({
      next: ({ items }) => {
        setPrivateProfiles([...items]);
        setIsLoadingUsers(false);
      },
    });

    return () => {
      publicSub.unsubscribe();
      privateSub.unsubscribe();
    };
  }, [enabled]);

  const users = useMemo(() => {
    const privateByUserId = new Map<string, Schema["PrivateProfile"]["type"]>();
    for (const profile of privateProfiles) {
      privateByUserId.set(profile.userId, profile);
    }

    const merged: AdminManagedUser[] = publicProfiles.map((publicProfile) => {
      const privateProfile = privateByUserId.get(publicProfile.userId);
      return {
        userId: publicProfile.userId,
        nickname: publicProfile.nickname ?? "",
        realName: privateProfile?.realName ?? "",
        identityType: normalizeIdentityType(publicProfile.identityType),
        createdBy: publicProfile.createdBy ?? privateProfile?.createdBy ?? null,
      };
    });

    return merged.sort((a, b) => a.nickname.localeCompare(b.nickname, "ja"));
  }, [publicProfiles, privateProfiles]);

  const createAdminUser = async ({ nickname, realName, adminUserId }: { nickname: string; realName: string; adminUserId: string }) => {
    const trimmedNickname = nickname.trim();
    const trimmedRealName = realName.trim();

    if (!trimmedNickname || !trimmedRealName) {
      window.alert("ニックネームと本名を入力してください。");
      return;
    }

    const userId = createAdminManagedUserId();
    const nicknameKey = toNicknameKey(trimmedNickname);

    setIsSavingUser(true);
    try {
      const existingReservation = await client.models.NicknameRegistry.get({ nicknameKey });
      if (existingReservation.data) {
        window.alert("このニックネームは既に使用されています。別のニックネームを入力してください。");
        return;
      }

      const reserveResult = await client.models.NicknameRegistry.create({ nicknameKey, userId });
      if (reserveResult.errors?.length) {
        window.alert("このニックネームは既に使用されています。別のニックネームを入力してください。");
        return;
      }

      const publicResult = await client.models.PublicProfile.create({
        userId,
        nickname: trimmedNickname,
        identityType: IDENTITY_TYPE_ADMIN_MANAGED,
        createdBy: adminUserId,
      });
      if (publicResult.errors?.length) {
        await client.models.NicknameRegistry.delete({ nicknameKey });
        window.alert(`利用者の公開プロフィール作成に失敗しました: ${publicResult.errors[0].message}`);
        return;
      }

      const privateResult = await client.models.PrivateProfile.create({
        userId,
        realName: trimmedRealName,
        identityType: IDENTITY_TYPE_ADMIN_MANAGED,
        createdBy: adminUserId,
      });
      if (privateResult.errors?.length) {
        await client.models.PublicProfile.delete({ userId });
        await client.models.NicknameRegistry.delete({ nicknameKey });
        window.alert(`利用者の非公開プロフィール作成に失敗しました: ${privateResult.errors[0].message}`);
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  const updateAdminUser = async ({
    userId,
    nickname,
    realName,
    adminUserId,
  }: {
    userId: string;
    nickname: string;
    realName: string;
    adminUserId: string;
  }) => {
    const trimmedNickname = nickname.trim();
    const trimmedRealName = realName.trim();

    if (!trimmedNickname || !trimmedRealName) {
      window.alert("ニックネームと本名を入力してください。");
      return;
    }

    setIsSavingUser(true);
    try {
      const [publicCurrent, privateCurrent] = await Promise.all([
        client.models.PublicProfile.get({ userId }),
        client.models.PrivateProfile.get({ userId }),
      ]);

      if (!publicCurrent.data || !privateCurrent.data) {
        window.alert("更新対象の利用者情報が見つかりません。");
        return;
      }

      const currentNicknameKey = toNicknameKey(publicCurrent.data.nickname ?? "");
      const nextNicknameKey = toNicknameKey(trimmedNickname);
      const isNicknameChanged = currentNicknameKey !== nextNicknameKey;

      if (isNicknameChanged) {
        const existingReservation = await client.models.NicknameRegistry.get({ nicknameKey: nextNicknameKey });
        if (existingReservation.data && existingReservation.data.userId !== userId) {
          window.alert("このニックネームは既に使用されています。別のニックネームを入力してください。");
          return;
        }

        if (!existingReservation.data) {
          const reserveResult = await client.models.NicknameRegistry.create({
            nicknameKey: nextNicknameKey,
            userId,
          });
          if (reserveResult.errors?.length) {
            window.alert("このニックネームは既に使用されています。別のニックネームを入力してください。");
            return;
          }
        }
      }

      const publicResult = await client.models.PublicProfile.update({
        userId,
        nickname: trimmedNickname,
        identityType: normalizeIdentityType(publicCurrent.data.identityType),
        createdBy: publicCurrent.data.createdBy ?? adminUserId,
      });
      if (publicResult.errors?.length) {
        window.alert(`利用者の公開プロフィール更新に失敗しました: ${publicResult.errors[0].message}`);
        return;
      }

      const privateResult = await client.models.PrivateProfile.update({
        userId,
        realName: trimmedRealName,
        identityType: normalizeIdentityType(privateCurrent.data.identityType),
        createdBy: privateCurrent.data.createdBy ?? adminUserId,
      });
      if (privateResult.errors?.length) {
        window.alert(`利用者の非公開プロフィール更新に失敗しました: ${privateResult.errors[0].message}`);
        return;
      }

      if (isNicknameChanged && currentNicknameKey) {
        const oldReservation = await client.models.NicknameRegistry.get({ nicknameKey: currentNicknameKey });
        if (oldReservation.data?.userId === userId) {
          await client.models.NicknameRegistry.delete({ nicknameKey: currentNicknameKey });
        }
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  return {
    users,
    isLoadingUsers,
    isSavingUser,
    createAdminUser,
    updateAdminUser,
  };
}
