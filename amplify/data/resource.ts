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
      status: a.enum(["open", "close", "hide"]),
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
      createdByUserId: a.id().required(),
    })
    .identifier(["resultId"])
    .authorization((allow) => [
      allow.authenticated().to(["read", "create"]),
      allow.ownerDefinedIn("createdByUserId").to(["update"]),
      allow.group("ADMIN").to(["update", "delete"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
