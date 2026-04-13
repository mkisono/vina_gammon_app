import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

const toNicknameKey = (nickname: string): string => {
  return nickname.trim().toLocaleLowerCase("ja-JP");
};

type UseProfileReturn = {
  hasProfile: boolean;
  isLoadingProfile: boolean;
  profileNickname: string;
  profileRealName: string;
  isSavingProfile: boolean;
  setProfileNickname: (value: string) => void;
  setProfileRealName: (value: string) => void;
  saveProfile: () => Promise<void>;
};

export function useProfile(userId: string | null): UseProfileReturn {
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileNickname, setProfileNickname] = useState("");
  const [profileRealName, setProfileRealName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const loadOrInitializeProfile = async () => {
      if (!userId) {
        // userId 確定前は未ロード扱いにして、画面側が早期リダイレクトしないようにする。
        setIsLoadingProfile(true);
        setHasProfile(false);
        return;
      }

      setIsLoadingProfile(true);

      try {
        const [publicRes, privateRes] = await Promise.all([
          client.models.PublicProfile.get({ userId }),
          client.models.PrivateProfile.get({ userId }),
        ]);

        const publicProfile = publicRes.data;
        const privateProfile = privateRes.data;

        setHasProfile(Boolean(publicProfile && privateProfile));
        setProfileNickname(publicProfile?.nickname ?? "");
        setProfileRealName(privateProfile?.realName ?? "");
      } catch {
        setHasProfile(false);
        setProfileNickname("");
        setProfileRealName("");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadOrInitializeProfile();
  }, [userId]);

  const saveProfile = async () => {
    if (!userId) {
      window.alert("ユーザー情報を取得できません。再ログインしてください。");
      return;
    }
    const trimmedNickname = profileNickname.trim();
    const trimmedRealName = profileRealName.trim();

    if (!trimmedNickname || !trimmedRealName) {
      window.alert("ニックネームと本名は必須です。");
      return;
    }
    const nicknameKey = toNicknameKey(trimmedNickname);

    setIsSavingProfile(true);
    try {
      const [publicGetRes, privateGetRes] = await Promise.all([
        client.models.PublicProfile.get({ userId }),
        client.models.PrivateProfile.get({ userId }),
      ]);

      // Frontend check: 先に重複を検知してユーザーへ即時フィードバック。
      const existingReservationRes = await client.models.NicknameRegistry.get({ nicknameKey });
      if (existingReservationRes.data && existingReservationRes.data.userId !== userId) {
        window.alert("このニックネームは既に使用されています。別のニックネームを入力してください。");
        return;
      }

      const publicExists = Boolean(publicGetRes.data);
      const privateExists = Boolean(privateGetRes.data);
      const previousNicknameKey = toNicknameKey(publicGetRes.data?.nickname ?? "");
      const isNicknameChanged = previousNicknameKey !== nicknameKey;
      let createdReservation = false;

      // Server-side check: nicknameKey を主キーに予約モデルを作成し一意制約を担保する。
      if (!existingReservationRes.data) {
        const reserveRes = await client.models.NicknameRegistry.create({
          nicknameKey,
          userId,
        });
        if (reserveRes.errors?.length) {
          window.alert("このニックネームは既に使用されています。別のニックネームを入力してください。");
          return;
        }
        createdReservation = true;
      }

      const [publicSaveRes, privateSaveRes] = await Promise.all([
        publicExists
          ? client.models.PublicProfile.update({
              userId,
              nickname: trimmedNickname,
            })
          : client.models.PublicProfile.create({
              userId,
              nickname: trimmedNickname,
            }),
        privateExists
          ? client.models.PrivateProfile.update({
              userId,
              realName: trimmedRealName,
            })
          : client.models.PrivateProfile.create({
              userId,
              realName: trimmedRealName,
            }),
      ]);

      if (publicSaveRes.errors?.length) {
        if (createdReservation && isNicknameChanged) {
          await client.models.NicknameRegistry.delete({ nicknameKey });
        }
        window.alert(`プロフィール更新に失敗しました: ${publicSaveRes.errors[0].message}`);
        return;
      }
      if (privateSaveRes.errors?.length) {
        if (createdReservation && isNicknameChanged) {
          await client.models.NicknameRegistry.delete({ nicknameKey });
        }
        window.alert(`プロフィール更新に失敗しました: ${privateSaveRes.errors[0].message}`);
        return;
      }

      if (isNicknameChanged && previousNicknameKey) {
        const oldReservationRes = await client.models.NicknameRegistry.get({
          nicknameKey: previousNicknameKey,
        });
        if (oldReservationRes.data?.userId === userId) {
          await client.models.NicknameRegistry.delete({ nicknameKey: previousNicknameKey });
        }
      }

      setHasProfile(true);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return {
    hasProfile,
    isLoadingProfile,
    profileNickname,
    profileRealName,
    isSavingProfile,
    setProfileNickname,
    setProfileRealName,
    saveProfile,
  };
}
