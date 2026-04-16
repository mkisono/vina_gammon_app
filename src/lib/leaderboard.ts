import type { Schema } from "../../amplify/data/resource";

export type LeaderboardScope = "EVENT" | "FISCAL_YEAR" | "ALL_TIME";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  nickname: string;
  totalPoint: number;
  totalPlayedPoint: number;
};

type BuildLeaderboardParams = {
  results: Array<Schema["MatchResult"]["type"]>;
  profiles: Array<Schema["PublicProfile"]["type"]>;
  eventIsTestById?: Map<string, boolean>;
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
  eventIsTestById?: Map<string, boolean>,
  eventId?: string,
  fiscalYearStartYear?: number
): boolean => {
  if (scope === "EVENT") {
    return !!eventId && result.eventId === eventId;
  }

  // 年間/All time 集計ではテストイベントを対象外とする。
  if ((scope === "FISCAL_YEAR" || scope === "ALL_TIME") && eventIsTestById) {
    const isTest = eventIsTestById.get(result.eventId ?? "") ?? false;
    if (isTest) {
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
  eventIsTestById,
  scope,
  eventId,
  fiscalYearStartYear,
}: BuildLeaderboardParams): LeaderboardRow[] => {
  const profileNicknameByUserId = new Map<string, string>();
  for (const profile of profiles) {
    profileNicknameByUserId.set(profile.userId, profile.nickname ?? profile.userId);
  }

  const aggregate = new Map<string, { totalPoint: number; totalPlayedPoint: number }>();

  const addResultForUser = (userId: string | null | undefined, deltaPoint: number, playedPoint: number) => {
    if (!userId) {
      return;
    }
    const current = aggregate.get(userId) ?? { totalPoint: 0, totalPlayedPoint: 0 };
    aggregate.set(userId, {
      totalPoint: current.totalPoint + deltaPoint,
      totalPlayedPoint: current.totalPlayedPoint + playedPoint,
    });
  };

  for (const result of results) {
    if (!filterByScope(result, scope, eventIsTestById, eventId, fiscalYearStartYear)) {
      continue;
    }

    const point = result.point ?? 0;

    if (point <= 0) {
      continue;
    }

    addResultForUser(result.playerUserId, point, point);
    addResultForUser(result.loserUserId, -point, point);
  }

  const rows = Array.from(aggregate.entries()).map(([userId, values]) => ({
    rank: 0,
    userId,
    nickname: profileNicknameByUserId.get(userId) ?? userId,
    totalPoint: values.totalPoint,
    totalPlayedPoint: values.totalPlayedPoint,
  }));

  rows.sort((a, b) => {
    if (b.totalPoint !== a.totalPoint) {
      return b.totalPoint - a.totalPoint;
    }
    return a.nickname.localeCompare(b.nickname, "ja");
  });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
};
