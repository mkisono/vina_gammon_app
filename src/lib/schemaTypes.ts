import type { Schema } from "../../amplify/data/resource";

export type EventStatus = NonNullable<Schema["Event"]["type"]["status"]>;

export const isEventStatus = (value: string): value is EventStatus => {
  return value === "open" || value === "close";
};