import { Heading, Text, View } from "@aws-amplify/ui-react";
import type { AuthUser } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { AppHeader } from "../components/layout/AppHeader";
import { ProfileSection } from "../components/profile/ProfileSection";
import { useAuthUser, useCurrentUser, useProfile } from "../hooks";

type ProfilePageProps = {
  signOut?: () => void;
  user?: AuthUser;
};

export function ProfilePage({ signOut }: ProfilePageProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuthUser();
  const { userId, isLoading } = useCurrentUser();
  const {
    hasProfile,
    isLoadingProfile,
    profileNickname,
    profileRealName,
    isSavingProfile,
    setProfileNickname,
    setProfileRealName,
    saveProfile,
  } = useProfile(userId);
  const initialProfileRequiredRef = useRef<boolean | null>(null);

  const canDecideProfile = !isLoading && !isLoadingProfile;
  const profileRequired = !hasProfile;

  useEffect(() => {
    if (!canDecideProfile) {
      return;
    }
    if (initialProfileRequiredRef.current === null) {
      initialProfileRequiredRef.current = profileRequired;
    }
  }, [canDecideProfile, profileRequired]);

  // 初回アクセス時にプロフィール未完了だったユーザーのみ、保存完了後にホームへ遷移。
  useEffect(() => {
    if (
      canDecideProfile
      && initialProfileRequiredRef.current === true
      && hasProfile
      && !isSavingProfile
    ) {
      navigate("/", { replace: true });
    }
  }, [canDecideProfile, hasProfile, isSavingProfile, navigate]);

  const handleSaveProfile = async () => {
    await saveProfile();
  };

  return (
    <View padding="2rem">
      <AppHeader
        isAdmin={isAdmin}
        onGoHome={() => navigate("/")}
        onGoEventCreate={() => navigate("/events/create")}
        onGoProfile={() => navigate("/profile")}
        onSignOut={signOut}
      />

      <View marginTop="1.5rem">
        <Heading level={3}>
          {hasProfile ? "プロフィール編集" : "プロフィール初期設定"}
        </Heading>
        {canDecideProfile && profileRequired && (
          <Text marginTop="0.75rem">
            アカウント作成後の初回サインインです。先にニックネームと本名を登録してください。
          </Text>
        )}
      </View>

      <ProfileSection
        hasProfile={hasProfile}
        profileNickname={profileNickname}
        profileRealName={profileRealName}
        isSavingProfile={isSavingProfile}
        onChangeNickname={setProfileNickname}
        onChangeRealName={setProfileRealName}
        onSaveProfile={handleSaveProfile}
      />

      {canDecideProfile && profileRequired && (
        <Text marginTop="1.5rem">
          ニックネームと本名を登録してから、イベント・試合結果機能を利用できます。
        </Text>
      )}
    </View>
  );
}
