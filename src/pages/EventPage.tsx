import { Heading, View } from "@aws-amplify/ui-react";
import type { AuthUser } from "aws-amplify/auth";
import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { AppHeader } from "../components/layout/AppHeader";
import { LeaderboardSection } from "../components/results/LeaderboardSection";
import { MatchResultSection } from "../components/results/MatchResultSection";
import { useAuthUser, useProfiles, useEvents, useMatchResults, useCurrentUser } from "../hooks";
import { buildLeaderboard } from "../lib/leaderboard";

type EventPageProps = {
  signOut?: () => void;
  user?: AuthUser;
};

export function EventPage({ signOut }: EventPageProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuthUser();
  const { eventId: encodedEventId } = useParams<{ eventId: string }>();
  const currentEventId = encodedEventId ? decodeURIComponent(encodedEventId) : "";
  const { userId: currentUserId, isLoading: isLoadingCurrentUser } = useCurrentUser();
  const isDataReady = !isLoadingCurrentUser && Boolean(currentUserId);

  const { profiles } = useProfiles(isDataReady);
  const { eventMap } = useEvents(isDataReady);
  const {
    eventResults,
    filteredResults,
    opponentNicknameOptions,
    editingOpponentNicknameOptions,
    adminPlayerNicknameOptions,
    adminLoserNicknameOptions,
    opponentNickname,
    adminMatchTime,
    adminWinnerNickname,
    adminLoserNickname,
    point,
    isJbsRated,
    isResultSubmitting,
    editingResultId,
    editingOpponentNickname,
    editingPoint,
    editingIsJbsRated,
    isUpdatingResult,
    isDeletingResult,
    setOpponentNickname,
    setAdminMatchTime,
    setAdminWinnerNickname,
    setAdminLoserNickname,
    setPoint,
    setIsJbsRated,
    setEditingOpponentNickname,
    setEditingPoint,
    setEditingIsJbsRated,
    createMatchResult,
    createAdminMatchResult,
    startEditResult,
    cancelEditResult,
    updateMatchResult,
    deleteMatchResult,
  } = useMatchResults(
    profiles,
    currentEventId,
    currentUserId || undefined,
    isAdmin,
    isDataReady && Boolean(currentEventId)
  );

  const currentEvent = useMemo(() => {
    if (!currentEventId) {
      return null;
    }
    return eventMap.get(currentEventId) ?? null;
  }, [eventMap, currentEventId]);

  const eventLeaderboardRows = useMemo(
    () =>
      buildLeaderboard({
        results: eventResults,
        profiles,
        scope: "EVENT",
        eventId: currentEventId,
      }),
    [eventResults, profiles, currentEventId]
  );

  const handleCreateMatchResult = async () => {
    if (!currentUserId || !currentEvent) return;
    await createMatchResult(currentEventId, currentEvent, currentUserId);
  };

  const handleUpdateMatchResult = async () => {
    if (!currentUserId) return;
    await updateMatchResult(currentUserId);
  };

  const handleCreateAdminMatchResult = async () => {
    if (!isAdmin || !currentEvent) return;
    await createAdminMatchResult(currentEventId, currentEvent);
  };

  const handleDeleteMatchResult = async (resultId: string) => {
    if (!isAdmin) return;
    const shouldDelete = window.confirm("この試合結果を削除します。よろしいですか？");
    if (!shouldDelete) return;
    await deleteMatchResult(resultId);
  };

  const profileNicknameByUserId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const profile of profiles) {
      map[profile.userId] = profile.nickname ?? profile.userId;
    }
    return map;
  }, [profiles]);

  const handleGoToHome = () => {
    navigate("/");
  };

  return (
    <View padding="2rem">
      <AppHeader
        isAdmin={isAdmin}
        onGoHome={handleGoToHome}
        onGoEventCreate={() => navigate("/events/create")}
        onGoProfile={() => navigate("/profile")}
        onSignOut={signOut}
      />

      {currentEvent && (
        <View marginTop="0.5rem">
          <Heading level={3}>{currentEvent.name}</Heading>
        </View>
      )}

      <MatchResultSection
        eventContext={{
          currentEventId,
          currentEvent,
          filteredResults,
        }}
        userContext={{
          isAdmin,
          currentUserId: currentUserId || undefined,
          profileNicknameByUserId,
        }}
        createForm={{
          opponentNickname,
          opponentNicknameOptions,
          adminMatchTime,
          adminWinnerNickname,
          adminLoserNickname,
          adminPlayerNicknameOptions,
          adminLoserNicknameOptions,
          point,
          isJbsRated,
          isResultSubmitting,
        }}
        editForm={{
          editingOpponentNicknameOptions,
          editingResultId,
          editingOpponentNickname,
          editingPoint,
          editingIsJbsRated,
          isUpdatingResult,
          isDeletingResult,
        }}
        actions={{
          onGoToHomePage: handleGoToHome,
          create: {
            user: {
              onChangeOpponentNickname: setOpponentNickname,
              onChangePoint: setPoint,
              onChangeIsJbsRated: setIsJbsRated,
              onCreateMatchResult: handleCreateMatchResult,
            },
            admin: {
              onChangeAdminMatchTime: setAdminMatchTime,
              onChangeAdminWinnerNickname: setAdminWinnerNickname,
              onChangeAdminLoserNickname: setAdminLoserNickname,
              onChangePoint: setPoint,
              onChangeIsJbsRated: setIsJbsRated,
              onCreateAdminMatchResult: handleCreateAdminMatchResult,
            },
          },
          edit: {
            onCancelEditResult: cancelEditResult,
            onChangeEditingOpponentNickname: setEditingOpponentNickname,
            onChangeEditingPoint: setEditingPoint,
            onChangeEditingIsJbsRated: setEditingIsJbsRated,
            onUpdateMatchResult: handleUpdateMatchResult,
          },
          table: {
            onStartEditResult: startEditResult,
            onDeleteMatchResult: handleDeleteMatchResult,
          },
        }}
      />

      <LeaderboardSection title="ランキング" rows={eventLeaderboardRows} />
    </View>
  );
}
