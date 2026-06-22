import { Button, Heading, View } from "@aws-amplify/ui-react";
import { useNavigate } from "react-router-dom";
import { EventListSection } from "../components/events/EventListSection";
import { LeaderboardSection } from "../components/results/LeaderboardSection";
import { useEvents, useLeaderboard } from "../hooks";
import { getFiscalYearStartYear } from "../lib/leaderboard";

export function PublicHomePage() {
  const navigate = useNavigate();
  const fiscalYearStartYear = getFiscalYearStartYear();
  const { sortedEvents, eventIsTestById } = useEvents({ enabled: true, realTime: false });
  const { rows: fiscalYearRows } = useLeaderboard({
    scope: "FISCAL_YEAR",
    fiscalYearStartYear,
    eventIsTestById,
    enabled: true,
    realTime: false,
  });

  return (
    <View padding="2rem">
      <View style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <Heading level={2}>海老名でバックギャモン</Heading>
        <Button size="small" onClick={() => navigate("/admin")}>
          管理者ログイン
        </Button>
      </View>

      <LeaderboardSection title={`${fiscalYearStartYear}年度ランキング`} rows={fiscalYearRows} />

      <EventListSection
        events={sortedEvents}
        isAdmin={false}
        isUpdatingStatus={false}
        onChangeEventStatus={() => {
          // Public viewers can only read events.
        }}
        onOpenEventPage={(eventId) => navigate(`/events/${encodeURIComponent(eventId)}`)}
      />
    </View>
  );
}
