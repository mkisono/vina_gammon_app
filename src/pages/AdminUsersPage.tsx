import { Button, Heading, Text, View } from "@aws-amplify/ui-react";
import type { AuthUser } from "aws-amplify/auth";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAuthUser, useCurrentUser } from "../hooks";

type AdminUsersPageProps = {
  signOut?: () => void;
  user?: AuthUser;
};

export function AdminUsersPage({ signOut }: AdminUsersPageProps) {
  const adminBasePath = "/admin";
  const navigate = useNavigate();
  const { isAdmin, isLoadingAuthUser } = useAuthUser();
  const { userId: currentUserId } = useCurrentUser();
  const { users, isLoadingUsers, isSavingUser, createAdminUser, updateAdminUser } = useAdminUsers(isAdmin);

  const [newNickname, setNewNickname] = useState("");
  const [newRealName, setNewRealName] = useState("");

  const [editingUserId, setEditingUserId] = useState("");
  const [editingNickname, setEditingNickname] = useState("");
  const [editingRealName, setEditingRealName] = useState("");

  const editingUser = useMemo(
    () => users.find((u) => u.userId === editingUserId) ?? null,
    [users, editingUserId]
  );

  const handleStartEdit = (userId: string) => {
    const target = users.find((u) => u.userId === userId);
    if (!target) {
      return;
    }
    setEditingUserId(target.userId);
    setEditingNickname(target.nickname);
    setEditingRealName(target.realName);
  };

  const handleCancelEdit = () => {
    setEditingUserId("");
    setEditingNickname("");
    setEditingRealName("");
  };

  const handleCreateUser = async () => {
    if (!isAdmin || !currentUserId) {
      window.alert("管理者ユーザー情報を取得できません。再ログインしてください。");
      return;
    }

    await createAdminUser({
      nickname: newNickname,
      realName: newRealName,
      adminUserId: currentUserId,
    });

    setNewNickname("");
    setNewRealName("");
  };

  const handleUpdateUser = async () => {
    if (!isAdmin || !currentUserId || !editingUser) {
      return;
    }

    await updateAdminUser({
      userId: editingUser.userId,
      nickname: editingNickname,
      realName: editingRealName,
      adminUserId: currentUserId,
    });

    handleCancelEdit();
  };

  if (isLoadingAuthUser) {
    return null;
  }

  return (
    <View padding="2rem">
      <AppHeader
        isAdmin={isAdmin}
        onGoHome={() => navigate(adminBasePath)}
        onGoEventCreate={() => navigate(`${adminBasePath}/events/create`)}
        onGoUserManagement={() => navigate(`${adminBasePath}/users`)}
        onGoProfile={() => navigate(`${adminBasePath}/profile`)}
        onSignOut={signOut}
      />

      {!isAdmin ? (
        <Text marginTop="1.5rem">このページは管理者のみアクセスできます。</Text>
      ) : (
        <>
          <View marginTop="1.5rem">
            <Heading level={3}>利用者管理</Heading>
            <Text marginTop="0.5rem">管理者が利用者の新規作成と更新を行います。</Text>
          </View>

          <View marginTop="1rem" className="event-form">
            <Heading level={5}>利用者の新規作成</Heading>
            <View marginTop="0.75rem">
              <Text>ニックネーム</Text>
              <input
                placeholder="ニックネーム"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
              />
            </View>
            <View marginTop="0.75rem">
              <Text>本名</Text>
              <input
                placeholder="本名"
                value={newRealName}
                onChange={(e) => setNewRealName(e.target.value)}
              />
            </View>
            <Button marginTop="0.9rem" onClick={handleCreateUser} isLoading={isSavingUser}>
              利用者を作成
            </Button>
          </View>

          <View marginTop="1.5rem">
            <Heading level={5}>利用者一覧</Heading>
            {isLoadingUsers ? (
              <Text marginTop="0.75rem">読み込み中...</Text>
            ) : users.length === 0 ? (
              <Text marginTop="0.75rem">登録済みの利用者はまだありません。</Text>
            ) : (
              <View className="result-table-wrap" marginTop="0.75rem">
                <table className="result-table">
                  <thead>
                    <tr>
                      <th scope="col">ニックネーム</th>
                      <th scope="col">本名</th>
                      <th scope="col">種別</th>
                      <th scope="col">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.userId}>
                        <td>{u.nickname}</td>
                        <td>{u.realName || "-"}</td>
                        <td>{u.identityType}</td>
                        <td>
                          <Button size="small" onClick={() => handleStartEdit(u.userId)}>
                            編集
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </View>
            )}
          </View>

          {editingUser && (
            <View marginTop="1.5rem" className="event-form">
              <Heading level={5}>利用者編集</Heading>
              <Text marginTop="0.5rem">対象: {editingUser.userId}</Text>
              <View marginTop="0.75rem">
                <Text>ニックネーム</Text>
                <input
                  placeholder="ニックネーム"
                  value={editingNickname}
                  onChange={(e) => setEditingNickname(e.target.value)}
                />
              </View>
              <View marginTop="0.75rem">
                <Text>本名</Text>
                <input
                  placeholder="本名"
                  value={editingRealName}
                  onChange={(e) => setEditingRealName(e.target.value)}
                />
              </View>
              <View marginTop="0.9rem" style={{ display: "flex", gap: "0.5rem" }}>
                <Button onClick={handleUpdateUser} isLoading={isSavingUser}>
                  保存
                </Button>
                <Button variation="link" onClick={handleCancelEdit}>
                  キャンセル
                </Button>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}
