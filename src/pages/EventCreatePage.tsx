import { Button, Heading, Text, View } from "@aws-amplify/ui-react";
import type { AuthUser } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { useAuthUser, useCurrentUser, useEvents } from "../hooks";

type EventCreatePageProps = {
  signOut?: () => void;
  user?: AuthUser;
};

export function EventCreatePage({ signOut }: EventCreatePageProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuthUser();
  const { userId, isLoading } = useCurrentUser();
  const {
    eventName,
    eventDate,
    eventStatus,
    isSubmitting,
    setEventName,
    setEventDate,
    setEventStatus,
    createEvent,
  } = useEvents(!isLoading && Boolean(userId));

  const handleCreate = async () => {
    if (!isAdmin) {
      window.alert("イベント作成は管理者のみ実行できます。");
      return;
    }
    await createEvent();
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

      <View marginTop="1.5rem" className="event-form">
        <Heading level={3}>イベント作成</Heading>

        {!isAdmin ? (
          <Text marginTop="0.75rem">このページには管理者のみアクセスできます。</Text>
        ) : (
          <>
            <View marginTop="0.75rem">
              <Text>イベント名</Text>
              <input
                placeholder="イベント名"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </View>
            <View marginTop="0.75rem">
              <Text>開催日</Text>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </View>
            <View marginTop="0.75rem">
              <Text>公開設定</Text>
              <select
                value={eventStatus}
                onChange={(e) => setEventStatus(e.target.value as "open" | "close" | "hide")}
                aria-label="イベント状態"
              >
                <option value="open">公開中（登録可能）</option>
                <option value="close">終了（閲覧のみ）</option>
                <option value="hide">非表示（一覧/集計対象外）</option>
              </select>
            </View>
            <Button marginTop="0.9rem" onClick={handleCreate} isLoading={isSubmitting}>
              イベントを作成
            </Button>
          </>
        )}
      </View>
    </View>
  );
}
