import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import type { DynamoDBStreamHandler } from "aws-lambda";

const ddb = new DynamoDBClient({});

const EVENT_TABLE_NAME = process.env.EVENT_TABLE_NAME;
const EVENT_USER_CONTRIBUTION_TABLE_NAME = process.env.EVENT_USER_CONTRIBUTION_TABLE_NAME;
const FISCAL_YEAR_LEADERBOARD_TABLE_NAME = process.env.FISCAL_YEAR_LEADERBOARD_TABLE_NAME;

const requiredEnv = [
  ["EVENT_TABLE_NAME", EVENT_TABLE_NAME],
  ["EVENT_USER_CONTRIBUTION_TABLE_NAME", EVENT_USER_CONTRIBUTION_TABLE_NAME],
  ["FISCAL_YEAR_LEADERBOARD_TABLE_NAME", FISCAL_YEAR_LEADERBOARD_TABLE_NAME],
] as const;

for (const [name, value] of requiredEnv) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

type ResultImage = {
  eventId: string;
  playerUserId: string;
  loserUserId: string;
  point: number;
  matchDate: string;
};

const eventIsTestCache = new Map<string, boolean>();

const getString = (image: Record<string, unknown> | undefined, key: string): string | null => {
  const value = image?.[key];
  if (!value || typeof value !== "object" || !("S" in value)) {
    return null;
  }
  const s = (value as Record<string, unknown>).S;
  return typeof s === "string" ? s : null;
};

const getNumber = (image: Record<string, unknown> | undefined, key: string): number | null => {
  const value = image?.[key];
  if (!value || typeof value !== "object" || !("N" in value)) {
    return null;
  }
  const n = (value as Record<string, unknown>).N;
  if (typeof n !== "string") return null;
  const parsed = Number(n);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseResultImage = (image: Record<string, unknown> | undefined): ResultImage | null => {
  const eventId = getString(image, "eventId");
  const playerUserId = getString(image, "playerUserId");
  const loserUserId = getString(image, "loserUserId");
  const point = getNumber(image, "point");
  const matchDate = getString(image, "matchDate");

  if (!eventId || !playerUserId || !loserUserId || !matchDate || point === null || point <= 0) {
    return null;
  }

  return { eventId, playerUserId, loserUserId, point, matchDate };
};

const getFiscalYearStartYear = (matchDate: string): number | null => {
  const [yearText, monthText] = matchDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return month >= 4 ? year : year - 1;
};

const isEventTest = async (eventId: string): Promise<boolean> => {
  const cached = eventIsTestCache.get(eventId);
  if (cached !== undefined) {
    return cached;
  }

  const response = await ddb.send(
    new GetItemCommand({
      TableName: EVENT_TABLE_NAME,
      Key: {
        eventId: { S: eventId },
      },
      ProjectionExpression: "isTest",
      ConsistentRead: true,
    })
  );

  const isTestValue = response.Item?.isTest;
  const isTest = Boolean(isTestValue && "BOOL" in isTestValue && isTestValue.BOOL);
  eventIsTestCache.set(eventId, isTest);
  return isTest;
};

const updateEventUserContribution = async (
  eventId: string,
  userId: string,
  fiscalYear: number,
  pointDelta: number,
  playedPointDelta: number
) => {
  await ddb.send(
    new UpdateItemCommand({
      TableName: EVENT_USER_CONTRIBUTION_TABLE_NAME,
      Key: {
        eventId: { S: eventId },
        userId: { S: userId },
      },
      UpdateExpression: "SET fiscalYear = :fiscalYear ADD pointDelta :pointDelta, playedPointDelta :playedPointDelta",
      ExpressionAttributeValues: {
        ":fiscalYear": { N: String(fiscalYear) },
        ":pointDelta": { N: String(pointDelta) },
        ":playedPointDelta": { N: String(playedPointDelta) },
      },
    })
  );
};

const updateFiscalYearLeaderboard = async (
  fiscalYear: number,
  userId: string,
  totalPointDelta: number,
  totalPlayedPointDelta: number
) => {
  await ddb.send(
    new UpdateItemCommand({
      TableName: FISCAL_YEAR_LEADERBOARD_TABLE_NAME,
      Key: {
        fiscalYear: { N: String(fiscalYear) },
        userId: { S: userId },
      },
      UpdateExpression: "ADD totalPoint :totalPointDelta, totalPlayedPoint :totalPlayedPointDelta",
      ExpressionAttributeValues: {
        ":totalPointDelta": { N: String(totalPointDelta) },
        ":totalPlayedPointDelta": { N: String(totalPlayedPointDelta) },
      },
    })
  );
};

const applyResultImageDelta = async (result: ResultImage, sign: 1 | -1): Promise<void> => {
  const isTest = await isEventTest(result.eventId);
  if (isTest) {
    return;
  }

  const fiscalYear = getFiscalYearStartYear(result.matchDate);
  if (fiscalYear === null) {
    return;
  }

  const perUserDelta = new Map<string, { pointDelta: number; playedPointDelta: number }>();
  const addDelta = (userId: string, pointDelta: number, playedPointDelta: number) => {
    const current = perUserDelta.get(userId) ?? { pointDelta: 0, playedPointDelta: 0 };
    perUserDelta.set(userId, {
      pointDelta: current.pointDelta + pointDelta,
      playedPointDelta: current.playedPointDelta + playedPointDelta,
    });
  };

  addDelta(result.playerUserId, sign * result.point, sign * result.point);
  addDelta(result.loserUserId, sign * -result.point, sign * result.point);

  const tasks: Array<Promise<unknown>> = [];
  for (const [userId, delta] of perUserDelta.entries()) {
    tasks.push(
      updateEventUserContribution(result.eventId, userId, fiscalYear, delta.pointDelta, delta.playedPointDelta)
    );
    tasks.push(
      updateFiscalYearLeaderboard(fiscalYear, userId, delta.pointDelta, delta.playedPointDelta)
    );
  }

  await Promise.all(tasks);
};

export const handler: DynamoDBStreamHandler = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === "INSERT") {
      const current = parseResultImage(record.dynamodb?.NewImage);
      if (current) {
        await applyResultImageDelta(current, 1);
      }
      continue;
    }

    if (record.eventName === "REMOVE") {
      const old = parseResultImage(record.dynamodb?.OldImage);
      if (old) {
        await applyResultImageDelta(old, -1);
      }
      continue;
    }

    if (record.eventName === "MODIFY") {
      const old = parseResultImage(record.dynamodb?.OldImage);
      if (old) {
        await applyResultImageDelta(old, -1);
      }
      const current = parseResultImage(record.dynamodb?.NewImage);
      if (current) {
        await applyResultImageDelta(current, 1);
      }
    }
  }

  return {
    batchItemFailures: [],
  };
};
