import { View } from "@aws-amplify/ui-react";
import type { AuthUser } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { EventListSection } from "../components/events/EventListSection";
import { LeaderboardSection } from "../components/results/LeaderboardSection";
import { getFiscalYearStartYear } from "../lib/leaderboard";
import {
  useAuthUser,
  useCurrentUser,
  useEvents,
  useLeaderboard,
} from "../hooks";

type HomePageProps = {
  signOut?: () => void;
  user?: AuthUser;
};

export function HomePage({ signOut }: HomePageProps) {
  const adminBasePath = "/admin";
  const fiscalYearStartYear = getFiscalYearStartYear();
  const navigate = useNavigate();
  const { isAdmin } = useAuthUser();
  const { userId, isLoading } = useCurrentUser();
  const isDataReady = !isLoading && Boolean(userId);
  const {
    events,
    sortedEvents,
    eventIsTestById,
    isUpdatingStatus,
    updateEventStatus,
  } = useEvents(isDataReady);
  const { rows: fiscalYearRows } = useLeaderboard({
    scope: "FISCAL_YEAR",
    fiscalYearStartYear,
    eventIsTestById,
    enabled: isDataReady,
  });

  const handleOpenEventPage = (eventId: string) => {
    navigate(`${adminBasePath}/events/${encodeURIComponent(eventId)}`);
  };

  const displayedEvents = isAdmin
    ? [...events].sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""))
    : sortedEvents;

  return (
    <View padding="2rem">
      <AppHeader
        isAdmin={isAdmin}
        onGoHome={() => navigate(adminBasePath)}
        onGoEventCreate={() => navigate(`${adminBasePath}/events/create`)}
        onGoUserManagement={() => navigate(`${adminBasePath}/users`)}
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
