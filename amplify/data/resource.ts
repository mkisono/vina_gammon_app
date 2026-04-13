import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Graphics Schema based on SPEC.md data models
 * Models: Event, PublicProfile, PrivateProfile, MatchResult
 * Authorization: Cognito groups (ADMIN) + owner rules
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
      allow.authenticated().to(["read"]),
      allow.group("ADMIN").to(["create", "update", "delete"]),
    ]),

  PublicProfile: a
    .model({
      userId: a.id().required(),
      nickname: a.string().required(),
    })
    .identifier(["userId"])
    .authorization((allow) => [
      allow.authenticated().to(["create", "read"]),
      allow.ownerDefinedIn("userId").to(["update"]),
      allow.group("ADMIN").to(["read", "update", "delete"]),
    ]),

  NicknameRegistry: a
    .model({
      nicknameKey: a.id().required(),
      userId: a.id().required(),
    })
    .identifier(["nicknameKey"])
    .authorization((allow) => [
      allow.ownerDefinedIn("userId").to(["create", "read", "update", "delete"]),
      allow.group("ADMIN").to(["read", "update", "delete"]),
    ]),

  PrivateProfile: a
    .model({
      userId: a.id().required(),
      realName: a.string().required(),
    })
    .identifier(["userId"])
    .authorization((allow) => [
      allow.authenticated().to(["create"]),
      allow.ownerDefinedIn("userId").to(["read", "update"]),
      allow.group("ADMIN").to(["read", "update", "delete"]),
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
    .authorization((allow) => [
      allow.authenticated().to(["read", "create"]),
      allow.ownerDefinedIn("playerUserId").to(["update"]),
      allow.group("ADMIN").to(["update", "delete"]),
    ]),

  FiscalYearLeaderboard: a
    .model({
      fiscalYear: a.integer().required(),
      userId: a.id().required(),
      totalPoint: a.integer().required(),
      totalPlayedPoint: a.integer().required(),
    })
    .identifier(["fiscalYear", "userId"])
    .authorization((allow) => [
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
