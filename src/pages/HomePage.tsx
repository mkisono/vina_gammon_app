import { View } from "@aws-amplify/ui-react";
import type { AuthUser } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AppHeader } from "../components/layout/AppHeader";
import { EventListSection } from "../components/events/EventListSection";
import { LeaderboardSection } from "../components/results/LeaderboardSection";
import { getFiscalYearStartYear } from "../lib/leaderboard";
import {
  useAuthUser,
  useCurrentUser,
  useProfile,
  useEvents,
  useLeaderboard,
} from "../hooks";

type HomePageProps = {
  signOut?: () => void;
  user?: AuthUser;
};

export function HomePage({ signOut }: HomePageProps) {
  const fiscalYearStartYear = getFiscalYearStartYear();
  const navigate = useNavigate();
  const { isAdmin } = useAuthUser();
  const { userId, isLoading } = useCurrentUser();
  const isDataReady = !isLoading && Boolean(userId);
  const {
    hasProfile,
    isLoadingProfile,
  } = useProfile(userId);
  const {
    events,
    sortedEvents,
    isUpdatingStatus,
    updateEventStatus,
  } = useEvents(isDataReady);
  const { rows: fiscalYearRows } = useLeaderboard({
    scope: "FISCAL_YEAR",
    fiscalYearStartYear,
  });

  const profileRequired = !hasProfile;
  const canDecideProfile = !isLoading && !isLoadingProfile;

  // 初回マウント時のみ、プロファイル初期設定が必須の場合プロファイルページへリダイレクト
  useEffect(() => {
    if (!canDecideProfile || !profileRequired) {
      return;
    }
    navigate("/profile", { replace: true });
  }, [canDecideProfile, profileRequired, navigate]);

  // 読み込み完了前は判定を保留する。
  if (!canDecideProfile) {
    return null;
  }

  // プロファイル未完了時はコンポーネントを表示しない（リダイレクト処理中）
  if (profileRequired) {
    return null;
  }

  const handleOpenEventPage = (eventId: string) => {
    navigate(`/events/${encodeURIComponent(eventId)}`);
  };

  const displayedEvents = isAdmin
    ? [...events].sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""))
    : sortedEvents;

  return (
    <View padding="2rem">
      <AppHeader
        isAdmin={isAdmin}
        onGoHome={() => navigate("/")}
        onGoEventCreate={() => navigate("/events/create")}
        onGoProfile={() => navigate("/profile")}
        onSignOut={signOut}
      />

      <LeaderboardSection
        title={`${fiscalYearStartYear}年度ランキング`}
        rows={fiscalYearRows}
      />

      <EventListSection
        events={displayedEvents}
        isAdmin={isAdmin}
        isUpdatingStatus={isUpdatingStatus}
        onChangeEventStatus={updateEventStatus}
        onOpenEventPage={handleOpenEventPage}
      />
    </View>
  );
}
