import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Graphics Schema based on SPEC.md data models
 * Models: Event, PublicProfile, PrivateProfile, MatchResult
 * Authorization: guest/public read + ADMIN write controls
 */
const schema = a.schema({
  Event: a
    .model({
      eventId: a.id().required(),
      name: a.string().required(),
      eventDate: a.date().required(),
      status: a.enum(["open", "close"]),
      isTest: a.boolean(),
    })
    .identifier(["eventId"])
    .authorization((allow) => [
      allow.guest().to(["read"]),
      allow.authenticated().to(["read"]),
      allow.group("ADMIN").to(["create", "update", "delete"]),
    ]),

  PublicProfile: a
    .model({
      userId: a.id().required(),
      nickname: a.string().required(),
      identityType: a.enum(["cognito_user", "admin_managed"]),
      createdBy: a.id(),
    })
    .identifier(["userId"])
    .authorization((allow) => [
      allow.guest().to(["read"]),
      allow.authenticated().to(["read"]),
      allow.group("ADMIN").to(["create", "read", "update", "delete"]),
    ]),

  NicknameRegistry: a
    .model({
      nicknameKey: a.id().required(),
      userId: a.id().required(),
    })
    .identifier(["nicknameKey"])
    .authorization((allow) => [
      allow.group("ADMIN").to(["create", "read", "update", "delete"]),
    ]),

  PrivateProfile: a
    .model({
      userId: a.id().required(),
      realName: a.string().required(),
      identityType: a.enum(["cognito_user", "admin_managed"]),
      createdBy: a.id(),
    })
    .identifier(["userId"])
    .authorization((allow) => [
      allow.group("ADMIN").to(["create", "read", "update", "delete"]),
    ]),

  AuthMigrationStatus: a
    .model({
      userId: a.id().required(),
      passwordMigratedAt: a.string(),
      passkeyRegisteredAt: a.string(),
      lastPromptedAt: a.string(),
    })
    .identifier(["userId"])
    .authorization((allow) => [
      allow.ownerDefinedIn("userId").to(["create", "read", "update", "delete"]),
      allow.group("ADMIN").to(["read", "update"]),
    ]),

  MatchResult: a
    .model({
      resultId: a.id().required(),
      eventId: a.id().required(),
      playerUserId: a.id().required(),
      loserUserId: a.id().required(),
      matchDate: a.date().required(),
      matchTime: a.time().required(),
      point: a.integer().required(), // 1-25 odd number
      isJbsRated: a.boolean().required(),
    })
    .identifier(["resultId"])
    .secondaryIndexes((index) => [
      index("eventId")
        .sortKeys(["matchDate", "matchTime"])
        .queryField("listMatchResultsByEvent"),
    ])
    .authorization((allow) => [
      allow.guest().to(["read"]),
      allow.authenticated().to(["read"]),
      allow.group("ADMIN").to(["create", "update", "delete"]),
    ]),

  FiscalYearLeaderboard: a
    .model({
      fiscalYear: a.integer().required(),
      userId: a.id().required(),
      totalPoint: a.integer().required(),
      totalPlayedPoint: a.integer().required(),
      winCount: a.integer(),
      lossCount: a.integer(),
    })
    .identifier(["fiscalYear", "userId"])
    .authorization((allow) => [
      allow.guest().to(["read"]),
      allow.authenticated().to(["read"]),
      allow.group("ADMIN").to(["create", "update", "delete"]),
    ]),

  EventUserContribution: a
    .model({
      eventId: a.id().required(),
      userId: a.id().required(),
      fiscalYear: a.integer().required(),
      pointDelta: a.integer().required(),
      playedPointDelta: a.integer().required(),
      winCountDelta: a.integer().required(),
      lossCountDelta: a.integer().required(),
    })
    .identifier(["eventId", "userId"])
    .authorization((allow) => [
      allow.group("ADMIN").to(["create", "read", "update", "delete"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
