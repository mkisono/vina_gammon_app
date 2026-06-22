import { Button, Heading, Text, View } from "@aws-amplify/ui-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LeaderboardSection } from "../components/results/LeaderboardSection";
import { MatchResultTable } from "../components/results/MatchResultTable";
import { useEvents, useProfiles } from "../hooks";
import { useMatchResultsSubscription } from "../hooks/matchResults/useMatchResultsSubscription";
import { buildEventResults } from "../hooks/matchResults/derived";
import { buildLeaderboard } from "../lib/leaderboard";

export function PublicEventPage() {
  const navigate = useNavigate();
  const { eventId: encodedEventId } = useParams<{ eventId: string }>();
  const currentEventId = encodedEventId ? decodeURIComponent(encodedEventId) : "";

  const { eventMap } = useEvents(true);
  const { profiles } = useProfiles(true);
  const { results } = useMatchResultsSubscription(currentEventId, Boolean(currentEventId));

  const currentEvent = useMemo(() => {
    if (!currentEventId) {
      return null;
    }
    return eventMap.get(currentEventId) ?? null;
  }, [currentEventId, eventMap]);

  const eventResults = useMemo(() => buildEventResults(results, currentEventId), [results, currentEventId]);

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

  const profileNicknameByUserId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const profile of profiles) {
      map[profile.userId] = profile.nickname ?? profile.userId;
    }
    return map;
  }, [profiles]);

  return (
    <View padding="2rem">
      <View style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <Heading level={2}>海老名でバックギャモン</Heading>
        <View style={{ display: "flex", gap: "0.5rem" }}>
          <Button size="small" variation="link" onClick={() => navigate("/")}>
            公開トップ
          </Button>
          <Button size="small" onClick={() => navigate("/admin")}>
            管理者ログイン
          </Button>
        </View>
      </View>

      {currentEvent && (
        <View marginTop="0.75rem">
          <Heading level={3}>{currentEvent.name}</Heading>
          <Text marginTop="0.35rem">開催日: {currentEvent.eventDate}</Text>
        </View>
      )}

      {!currentEvent ? (
        <Text marginTop="1rem">指定されたイベントが見つかりません。</Text>
      ) : (
        <>
          <LeaderboardSection title="イベントランキング" rows={eventLeaderboardRows} />
          <View marginTop="1.5rem">
            <MatchResultTable
              filteredResults={eventResults}
              isAdmin={false}
              currentUserId={undefined}
              winCount={0}
              lossCount={0}
              profileNicknameByUserId={profileNicknameByUserId}
              editingResultId=""
              isDeletingResult={false}
              onStartEditResult={() => {
                // Public viewers cannot edit.
              }}
              onDeleteMatchResult={() => {
                // Public viewers cannot delete.
              }}
            />
          </View>
        </>
      )}
    </View>
  );
}
