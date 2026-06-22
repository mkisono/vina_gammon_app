import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import {
  buildLeaderboard,
  type LeaderboardRow,
  type LeaderboardScope,
} from "../lib/leaderboard";
import { fetchAllPages } from "./fetchAllPages";

const client = generateClient<Schema>();

const isNonNullable = <T,>(value: T | null | undefined): value is T => value != null;

type UseLeaderboardParams = {
  scope: LeaderboardScope;
  eventId?: string;
  fiscalYearStartYear?: number;
  eventIsTestById?: Map<string, boolean>;
  enabled?: boolean;
  realTime?: boolean;
};

type UseLeaderboardReturn = {
  rows: LeaderboardRow[];
};

/** FiscalYearLeaderboard MV アイテムをランク付き LeaderboardRow に変換 */
function buildFiscalYearRows(
  mvItems: Array<Schema["FiscalYearLeaderboard"]["type"]>,
  profiles: Array<Schema["PublicProfile"]["type"]>
): LeaderboardRow[] {
  const nicknameById = new Map<string, string>();
  for (const p of profiles.filter(isNonNullable)) {
    nicknameById.set(p.userId, p.nickname ?? p.userId);
  }
  const sorted = mvItems
    .filter(isNonNullable)
    .sort((a, b) => (b.totalPoint ?? 0) - (a.totalPoint ?? 0));
  return sorted.map((item, i) => ({
    rank: i + 1,
    userId: item.userId,
    nickname: nicknameById.get(item.userId) ?? item.userId,
    totalPoint: item.totalPoint ?? 0,
    totalPlayedPoint: item.totalPlayedPoint ?? 0,
    winCount: item.winCount ?? 0,
    lossCount: item.lossCount ?? 0,
  }));
}

export function useLeaderboard({
  scope,
  eventId,
  fiscalYearStartYear,
  eventIsTestById: externalEventIsTestById,
  enabled = true,
  realTime = true,
}: UseLeaderboardParams): UseLeaderboardReturn {
  const isFiscalYear = scope === "FISCAL_YEAR";

  // --- MV path (FISCAL_YEAR) ---
  const [mvItems, setMvItems] = useState<Array<Schema["FiscalYearLeaderboard"]["type"]>>([]);

  // --- Classic path (EVENT / ALL_TIME) ---
  const [results, setResults] = useState<Array<Schema["MatchResult"]["type"]>>([]);
  const [events, setEvents] = useState<Array<Schema["Event"]["type"]>>([]);

  // profiles は両パスで共用
  const [profiles, setProfiles] = useState<Array<Schema["PublicProfile"]["type"]>>([]);

  const resultFilter = useMemo(() => {
    if (isFiscalYear) return undefined; // MV パスでは不使用
    if (scope === "EVENT") {
      if (!eventId) return null;
      return { eventId: { eq: eventId } };
    }
    return undefined;
  }, [isFiscalYear, scope, eventId]);

  // FISCAL_YEAR: MV を購読
  useEffect(() => {
    if (!enabled || !isFiscalYear || fiscalYearStartYear === undefined) return;

    if (!realTime) {
      let cancelled = false;
      const fetchFiscalYearRows = async () => {
        try {
          const [mvItems, profileItems] = await Promise.all([
            fetchAllPages((nextToken) =>
              client.models.FiscalYearLeaderboard.list({
                filter: { fiscalYear: { eq: fiscalYearStartYear } },
                authMode: "iam",
                nextToken,
              })
            ),
            fetchAllPages((nextToken) => client.models.PublicProfile.list({ authMode: "iam", nextToken })),
          ]);
          if (!cancelled) {
            setMvItems(mvItems);
            setProfiles(profileItems);
          }
        } catch (error) {
          console.error("Failed to fetch fiscal year leaderboard.", error);
        }
      };

      void fetchFiscalYearRows();
      return () => {
        cancelled = true;
      };
    }

    const mvSub = client.models.FiscalYearLeaderboard.observeQuery({
      filter: { fiscalYear: { eq: fiscalYearStartYear } },
    }).subscribe({
      next: ({ items }) => setMvItems(items.filter(isNonNullable)),
    });

    const profileSub = client.models.PublicProfile.observeQuery().subscribe({
      next: ({ items }) => setProfiles(items.filter(isNonNullable)),
    });

    return () => {
      mvSub.unsubscribe();
      profileSub.unsubscribe();
    };
  }, [enabled, isFiscalYear, fiscalYearStartYear, realTime]);

  // EVENT / ALL_TIME: MatchResult を購読
  useEffect(() => {
    if (!enabled || isFiscalYear) return;
    if (resultFilter === null) return;

    if (!realTime) {
      let cancelled = false;
      const fetchResults = async () => {
        try {
          const [resultItems, profileItems, eventItems] = await Promise.all([
            fetchAllPages((nextToken) =>
              resultFilter
                ? client.models.MatchResult.list({ filter: resultFilter, authMode: "iam", nextToken })
                : client.models.MatchResult.list({ authMode: "iam", nextToken })
            ),
            fetchAllPages((nextToken) => client.models.PublicProfile.list({ authMode: "iam", nextToken })),
            externalEventIsTestById
              ? Promise.resolve([] as Array<Schema["Event"]["type"]>)
              : fetchAllPages((nextToken) => client.models.Event.list({ authMode: "iam", nextToken })),
          ]);
          if (!cancelled) {
            setResults(resultItems);
            setProfiles(profileItems);
            if (!externalEventIsTestById) {
              setEvents(eventItems);
            }
          }
        } catch (error) {
          console.error("Failed to fetch leaderboard data.", error);
        }
      };

      void fetchResults();
      return () => {
        cancelled = true;
      };
    }

    const resultSub = client.models.MatchResult.observeQuery(
      resultFilter ? { filter: resultFilter } : undefined
    ).subscribe({ next: ({ items }) => setResults(items.filter(isNonNullable)) });

    const profileSub = client.models.PublicProfile.observeQuery().subscribe({
      next: ({ items }) => setProfiles(items.filter(isNonNullable)),
    });

    const eventSub = externalEventIsTestById
      ? null
      : client.models.Event.observeQuery().subscribe({
          next: ({ items }) => setEvents(items.filter(isNonNullable)),
        });

    return () => {
      resultSub.unsubscribe();
      profileSub.unsubscribe();
      eventSub?.unsubscribe();
    };
  }, [enabled, isFiscalYear, resultFilter, externalEventIsTestById, realTime]);

  const internalEventIsTestById = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const event of events) {
      map.set(event.eventId, Boolean(event.isTest));
    }
    return map;
  }, [events]);

  const eventIsTestById = externalEventIsTestById ?? internalEventIsTestById;

  const rows = useMemo(() => {
    if (isFiscalYear) {
      return buildFiscalYearRows(mvItems, profiles);
    }
    if (resultFilter === null) return [];
    return buildLeaderboard({
      results,
      profiles,
      eventIsTestById,
      scope,
      eventId,
      fiscalYearStartYear,
    });
  }, [isFiscalYear, mvItems, results, profiles, eventIsTestById, scope, eventId, fiscalYearStartYear, resultFilter]);

  return { rows };
}
