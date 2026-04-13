import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import {
  buildLeaderboard,
  type LeaderboardRow,
  type LeaderboardScope,
} from "../lib/leaderboard";

const client = generateClient<Schema>();

type UseLeaderboardParams = {
  scope: LeaderboardScope;
  eventId?: string;
  fiscalYearStartYear?: number;
};

type UseLeaderboardReturn = {
  rows: LeaderboardRow[];
};

export function useLeaderboard({
  scope,
  eventId,
  fiscalYearStartYear,
}: UseLeaderboardParams): UseLeaderboardReturn {
  const [results, setResults] = useState<Array<Schema["MatchResult"]["type"]>>([]);
  const [profiles, setProfiles] = useState<Array<Schema["PublicProfile"]["type"]>>([]);
  const [events, setEvents] = useState<Array<Schema["Event"]["type"]>>([]);

  useEffect(() => {
    const resultSub = client.models.MatchResult.observeQuery().subscribe({
      next: ({ items }) => setResults([...items]),
    });

    const profileSub = client.models.PublicProfile.observeQuery().subscribe({
      next: ({ items }) => setProfiles([...items]),
    });

    const eventSub = client.models.Event.observeQuery().subscribe({
      next: ({ items }) => setEvents([...items]),
    });

    return () => {
      resultSub.unsubscribe();
      profileSub.unsubscribe();
      eventSub.unsubscribe();
    };
  }, []);

  const eventStatusById = useMemo(() => {
    const map = new Map<string, "open" | "close" | "hide">();
    for (const event of events) {
      map.set(event.eventId, (event.status ?? "open") as "open" | "close" | "hide");
    }
    return map;
  }, [events]);

  const rows = useMemo(
    () =>
      buildLeaderboard({
        results,
        profiles,
        eventStatusById,
        scope,
        eventId,
        fiscalYearStartYear,
      }),
    [results, profiles, eventStatusById, scope, eventId, fiscalYearStartYear]
  );

  return { rows };
}
