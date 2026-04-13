import { Button, Text, View } from "@aws-amplify/ui-react";

type ProfileSectionProps = {
  hasProfile: boolean;
  profileNickname: string;
  profileRealName: string;
  isSavingProfile: boolean;
  onChangeNickname: (value: string) => void;
  onChangeRealName: (value: string) => void;
  onSaveProfile: () => void;
};

export function ProfileSection({
  hasProfile,
  profileNickname,
  profileRealName,
  isSavingProfile,
  onChangeNickname,
  onChangeRealName,
  onSaveProfile,
}: ProfileSectionProps) {
  return (
    <View marginTop="1.5rem">
      <View marginTop="0.75rem">
        <Text>ニックネーム（対戦相手に表示される名前）</Text>
        <input
          placeholder="例: えびな太郎"
          aria-label="ニックネーム"
          value={profileNickname}
          onChange={(e) => onChangeNickname(e.target.value)}
        />
      </View>
      <View marginTop="0.75rem">
        <Text>本名（管理用。公開されません）</Text>
        <input
          placeholder="例: 海老名 太郎"
          aria-label="本名"
          value={profileRealName}
          onChange={(e) => onChangeRealName(e.target.value)}
        />
      </View>
      <Button marginTop="0.75rem" onClick={onSaveProfile} isLoading={isSavingProfile}>
        {hasProfile ? "プロフィールを更新" : "プロフィールを登録"}
      </Button>
    </View>
  );
}
