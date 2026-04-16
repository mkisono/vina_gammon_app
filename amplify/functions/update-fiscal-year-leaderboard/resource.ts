import { defineFunction } from "@aws-amplify/backend";

export const updateFiscalYearLeaderboard = defineFunction({
  name: "update-fiscal-year-leaderboard",
  resourceGroupName: "data",
});
