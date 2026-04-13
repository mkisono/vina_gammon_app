import type { Schema } from "../../../amplify/data/resource";

export const buildOpponentNicknameOptions = (
  profiles: Array<Schema["PublicProfile"]["type"]>,
  currentUserId?: string
): string[] => {
  const nicknames = profiles
    .filter((p) => p.userId !== currentUserId)
    .map((p) => (p.nickname ?? "").trim())
    .filter((name) => name.length > 0);
  return [...new Set(nicknames)].sort((a, b) => a.localeCompare(b));
};

export const buildEventResults = (
  results: Array<Schema["MatchResult"]["type"]>,
  currentEventId: string
): Array<Schema["MatchResult"]["type"]> => {
  if (!currentEventId) {
    return [];
  }
  return [...results]
    .filter((r) => r.eventId === currentEventId)
    .sort((a, b) => `${b.matchDate ?? ""} ${b.matchTime ?? ""}`.localeCompare(`${a.matchDate ?? ""} ${a.matchTime ?? ""}`));
};

export const buildFilteredResults = (
  eventResults: Array<Schema["MatchResult"]["type"]>,
  currentUserId: string | undefined,
  isAdmin: boolean
): Array<Schema["MatchResult"]["type"]> => {
  if (isAdmin) {
    return eventResults;
  }
  if (!currentUserId) {
    return [];
  }
  return eventResults.filter((r) => r.playerUserId === currentUserId || r.loserUserId === currentUserId);
};
