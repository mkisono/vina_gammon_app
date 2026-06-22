export const PUBLIC_READ_MODELS = [
  "Event",
  "MatchResult",
  "PublicProfile",
  "FiscalYearLeaderboard",
] as const;

export const ADMIN_WRITE_MODELS = [
  "Event",
  "PublicProfile",
  "PrivateProfile",
  "NicknameRegistry",
  "MatchResult",
] as const;

export const PUBLIC_CAPABILITIES = {
  canViewHomePage: true,
  canViewEventPage: true,
  canViewRankingDetail: true,
  canCreateEvent: false,
  canUpdateEventStatus: false,
  canManageUsers: false,
  canCreateMatchResult: false,
  canEditMatchResult: false,
  canDeleteMatchResult: false,
} as const;

export const ADMIN_CAPABILITIES = {
  canViewHomePage: true,
  canViewEventPage: true,
  canViewRankingDetail: true,
  canCreateEvent: true,
  canUpdateEventStatus: true,
  canManageUsers: true,
  canCreateMatchResult: true,
  canEditMatchResult: true,
  canDeleteMatchResult: true,
} as const;
