import {
  Alert,
  Button,
  Flex,
  Heading,
  Text,
  TextField,
  View,
} from "@aws-amplify/ui-react";
import {
  associateWebAuthnCredential,
  confirmResetPassword,
  resetPassword,
} from "aws-amplify/auth";
import type { AuthUser } from "aws-amplify/auth";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { useAuthMigrationStatus, useAuthUser, useCurrentUser, useProfile } from "../hooks";

type SecuritySetupPageProps = {
  signOut?: () => void;
  user?: AuthUser;
};

export function SecuritySetupPage({ signOut }: SecuritySetupPageProps) {
  const adminBasePath = "/admin";
  const navigate = useNavigate();
  const { isAdmin } = useAuthUser();
  const { userId, email, isLoading } = useCurrentUser();
  const { hasProfile, isLoadingProfile } = useProfile(userId);
  const {
    isLoadingMigrationStatus,
    isMigrationStatusResolved,
    isPasswordMigrated,
    isPasskeyRegistered,
    markPromptShown,
    markPasswordMigrated,
    markPasskeyRegistered,
  } = useAuthMigrationStatus(userId);

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const isDecisionReady = !isLoading && !isLoadingProfile && !isLoadingMigrationStatus && isMigrationStatusResolved;

  useEffect(() => {
    if (!isDecisionReady || isPasswordMigrated) {
      return;
    }
    void markPromptShown();
  }, [isDecisionReady, isPasswordMigrated, markPromptShown]);

  const canSubmitPassword = useMemo(() => {
    if (!confirmationCode.trim()) {
      return false;
    }
    if (!newPassword.trim()) {
      return false;
    }
    if (!confirmPassword.trim()) {
      return false;
    }
    return true;
  }, [confirmationCode, newPassword, confirmPassword]);

  const handleSendResetCode = async () => {
    if (!email) {
      setErrorMessage("メールアドレスを取得できません。再ログインしてください。");
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsSendingCode(true);
    try {
      await resetPassword({ username: email });
      setCodeSent(true);
      setInfoMessage("確認コードを送信しました。メールをご確認ください。");
    } catch {
      setErrorMessage("確認コードの送信に失敗しました。少し待ってから再試行してください。");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!email) {
      setErrorMessage("メールアドレスを取得できません。再ログインしてください。");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("新しいパスワードと確認用パスワードが一致しません。");
      return;
    }

    setErrorMessage(null);
    setInfoMessage(null);
    setIsVerifyingPassword(true);
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: confirmationCode.trim(),
        newPassword,
      });
      await markPasswordMigrated();
      setInfoMessage("パスワード設定が完了しました。");
    } catch {
      setErrorMessage("パスワード設定に失敗しました。確認コードや入力内容をご確認ください。");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsRegisteringPasskey(true);
    try {
      await associateWebAuthnCredential();
      await markPasskeyRegistered();
      setInfoMessage("passkey登録が完了しました。");
    } catch {
      setErrorMessage("passkey登録に失敗しました。対応端末で再試行してください。");
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleContinueWithoutPasskey = () => {
    if (!hasProfile) {
      navigate(`${adminBasePath}/profile`, { replace: true });
      return;
    }
    navigate(adminBasePath, { replace: true });
  };

  if (!isDecisionReady) {
    return null;
  }

  return (
    <View padding="2rem">
      <AppHeader
        isAdmin={isAdmin}
        onGoHome={() => navigate(adminBasePath)}
        onGoEventCreate={() => navigate(`${adminBasePath}/events/create`)}
        onGoProfile={() => navigate(`${adminBasePath}/profile`)}
        onGoSecuritySetup={() => navigate(`${adminBasePath}/security-setup`)}
        onSignOut={signOut}
      />

      <View marginTop="1.5rem">
        <Heading level={3}>セキュリティ設定</Heading>
        <Text marginTop="0.75rem">
          {isPasswordMigrated
            ? "パスワード設定は完了しています。必要に応じてpasskeyを登録してください。"
            : "ログイン方式移行のため、先にパスワード設定を完了してください。passkeyは任意で登録できます。"}
        </Text>
      </View>

      {errorMessage && (
        <Alert marginTop="1rem" variation="error">
          {errorMessage}
        </Alert>
      )}

      {infoMessage && (
        <Alert marginTop="1rem" variation="info">
          {infoMessage}
        </Alert>
      )}

      <View marginTop="1.25rem">
        <Heading level={5}>Step 1. パスワード設定（必須）</Heading>
        <Text marginTop="0.5rem">登録メール: {email ?? "不明"}</Text>

        {isPasswordMigrated && (
          <Alert marginTop="0.75rem" variation="success">
            パスワード設定は完了済みです。
          </Alert>
        )}

        <Flex direction="column" gap="0.75rem" marginTop="0.75rem">
          <Button
            type="button"
            variation="primary"
            isLoading={isSendingCode}
            isDisabled={isPasswordMigrated}
            onClick={handleSendResetCode}
          >
            確認コードを送信
          </Button>

          {!isPasswordMigrated && codeSent && (
            <>
              <TextField
                label="確認コード"
                value={confirmationCode}
                onChange={(event) => setConfirmationCode(event.target.value)}
              />
              <TextField
                label="新しいパスワード"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <TextField
                label="新しいパスワード（確認）"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <Button
                type="button"
                variation="primary"
                isDisabled={!canSubmitPassword}
                isLoading={isVerifyingPassword}
                onClick={handleVerifyPassword}
              >
                パスワードを設定して続行
              </Button>
            </>
          )}
        </Flex>
      </View>

      <View marginTop="1.75rem">
        <Heading level={5}>Step 2. passkey登録（任意）</Heading>
        <Text marginTop="0.5rem">
          対応端末なら passkey を登録すると、次回以降は生体認証などでログインできます。
        </Text>
        <Flex gap="0.75rem" marginTop="0.75rem" wrap="wrap">
          <Button
            type="button"
            variation="primary"
            isLoading={isRegisteringPasskey}
            isDisabled={!isPasswordMigrated}
            onClick={handleRegisterPasskey}
          >
            passkeyを登録
          </Button>
          <Button
            type="button"
            variation="link"
            isDisabled={!isPasswordMigrated}
            onClick={handleContinueWithoutPasskey}
          >
            今は登録せずに続行
          </Button>
        </Flex>
        {isPasskeyRegistered && (
          <Text marginTop="0.5rem">passkey登録済みです。</Text>
        )}
      </View>
    </View>
  );
}
