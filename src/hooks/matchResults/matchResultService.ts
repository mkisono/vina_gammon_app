import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();

type CreateMatchResultInput = {
  resultId: string;
  eventId: string;
  playerUserId: string;
  loserUserId: string;
  matchDate: string;
  matchTime: string;
  point: number;
  isJbsRated: boolean;
};

type UpdateMatchResultInput = {
  resultId: string;
  loserUserId: string;
  point: number;
  isJbsRated: boolean;
};

export const createMatchResultRecord = async (input: CreateMatchResultInput) => {
  return client.models.MatchResult.create(input);
};

export const updateMatchResultRecord = async (input: UpdateMatchResultInput) => {
  return client.models.MatchResult.update(input);
};
