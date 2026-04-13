import type { Schema } from "../../amplify/data/resource";

export type LeaderboardScope = "EVENT" | "FISCAL_YEAR" | "ALL_TIME";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  nickname: string;
  totalPoint: number;
  matchCount: number;
};

type BuildLeaderboardParams = {
  results: Array<Schema["MatchResult"]["type"]>;
  profiles: Array<Schema["PublicProfile"]["type"]>;
  eventStatusById?: Map<string, "open" | "close" | "hide">;
  scope: LeaderboardScope;
  eventId?: string;
  fiscalYearStartYear?: number;
};

export const getFiscalYearStartYear = (date: Date = new Date()): number => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 4 ? year : year - 1;
};

const isInFiscalYear = (matchDate: string | null | undefined, fiscalYearStartYear: number): boolean => {
  if (!matchDate) {
    return false;
  }
  const start = `${fiscalYearStartYear}-04-01`;
  const end = `${fiscalYearStartYear + 1}-03-31`;
  return matchDate >= start && matchDate <= end;
};

const filterByScope = (
  result: Schema["MatchResult"]["type"],
  scope: LeaderboardScope,
  eventStatusById?: Map<string, "open" | "close" | "hide">,
  eventId?: string,
  fiscalYearStartYear?: number
): boolean => {
  if (scope === "EVENT") {
    return !!eventId && result.eventId === eventId;
  }

  // 年間/All time 集計では hide イベントを対象外とする。
  if ((scope === "FISCAL_YEAR" || scope === "ALL_TIME") && eventStatusById) {
    const status = eventStatusById.get(result.eventId ?? "") ?? "open";
    if (status === "hide") {
      return false;
    }
  }

  if (scope === "FISCAL_YEAR") {
    if (fiscalYearStartYear === undefined) {
      return false;
    }
    return isInFiscalYear(result.matchDate, fiscalYearStartYear);
  }

  return true;
};

export const buildLeaderboard = ({
  results,
  profiles,
  eventStatusById,
  scope,
  eventId,
  fiscalYearStartYear,
}: BuildLeaderboardParams): LeaderboardRow[] => {
  const profileNicknameByUserId = new Map<string, string>();
  for (const profile of profiles) {
    profileNicknameByUserId.set(profile.userId, profile.nickname ?? profile.userId);
  }

  const aggregate = new Map<string, { totalPoint: number; matchCount: number }>();

  for (const result of results) {
    if (!filterByScope(result, scope, eventStatusById, eventId, fiscalYearStartYear)) {
      continue;
    }

    const userId = result.playerUserId;
    const point = result.point ?? 0;

    if (!userId || point <= 0) {
      continue;
    }

    const current = aggregate.get(userId) ?? { totalPoint: 0, matchCount: 0 };
    aggregate.set(userId, {
      totalPoint: current.totalPoint + point,
      matchCount: current.matchCount + 1,
    });
  }

  const rows = Array.from(aggregate.entries()).map(([userId, values]) => ({
    rank: 0,
    userId,
    nickname: profileNicknameByUserId.get(userId) ?? userId,
    totalPoint: values.totalPoint,
    matchCount: values.matchCount,
  }));

  rows.sort((a, b) => {
    if (b.totalPoint !== a.totalPoint) {
      return b.totalPoint - a.totalPoint;
    }
    return a.nickname.localeCompare(b.nickname, "ja");
  });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
};
