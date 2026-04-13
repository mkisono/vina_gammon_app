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
  eventStatusById?: Map<string, "open" | "close" | "hide">;
  enabled?: boolean;
};

type UseLeaderboardReturn = {
  rows: LeaderboardRow[];
};

export function useLeaderboard({
  scope,
  eventId,
  fiscalYearStartYear,
  eventStatusById: externalEventStatusById,
  enabled = true,
}: UseLeaderboardParams): UseLeaderboardReturn {
  const [results, setResults] = useState<Array<Schema["MatchResult"]["type"]>>([]);
  const [profiles, setProfiles] = useState<Array<Schema["PublicProfile"]["type"]>>([]);
  const [events, setEvents] = useState<Array<Schema["Event"]["type"]>>([]);

  const resultFilter = useMemo(() => {
    if (scope === "EVENT") {
      if (!eventId) {
        return null;
      }
      return { eventId: { eq: eventId } };
    }
    if (scope === "FISCAL_YEAR") {
      if (fiscalYearStartYear === undefined) {
        return null;
      }
      const fiscalYearRange: [string, string] = [
        `${fiscalYearStartYear}-04-01`,
        `${fiscalYearStartYear + 1}-03-31`,
      ];
      return {
        matchDate: {
          between: fiscalYearRange,
        },
      };
    }
    return undefined;
  }, [scope, eventId, fiscalYearStartYear]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (resultFilter === null) {
      return;
    }

    const resultSub = client.models.MatchResult.observeQuery(
      resultFilter ? { filter: resultFilter } : undefined
    ).subscribe({
      next: ({ items }) => setResults([...items]),
    });

    const profileSub = client.models.PublicProfile.observeQuery().subscribe({
      next: ({ items }) => setProfiles([...items]),
    });

    const eventSub = externalEventStatusById
      ? null
      : client.models.Event.observeQuery().subscribe({
          next: ({ items }) => setEvents([...items]),
        });

    return () => {
      resultSub.unsubscribe();
      profileSub.unsubscribe();
      eventSub?.unsubscribe();
    };
  }, [enabled, resultFilter, externalEventStatusById]);

  const internalEventStatusById = useMemo(() => {
    const map = new Map<string, "open" | "close" | "hide">();
    for (const event of events) {
      map.set(event.eventId, (event.status ?? "open") as "open" | "close" | "hide");
    }
    return map;
  }, [events]);

  const eventStatusById = externalEventStatusById ?? internalEventStatusById;

  const rows = useMemo(
    () => {
      if (resultFilter === null) {
        return [];
      }
      return buildLeaderboard({
        results,
        profiles,
        eventStatusById,
        scope,
        eventId,
        fiscalYearStartYear,
      });
    },
    [results, profiles, eventStatusById, scope, eventId, fiscalYearStartYear, resultFilter]
  );

  return { rows };
}
