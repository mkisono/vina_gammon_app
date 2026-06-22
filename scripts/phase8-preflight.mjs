import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();

const readJson = (relativePath) => {
  const fullPath = path.join(rootDir, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
};

const readText = (relativePath) => {
  const fullPath = path.join(rootDir, relativePath);
  return fs.readFileSync(fullPath, "utf8");
};

const expectCondition = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const ensurePublicReadRule = (model, modelName) => {
  const rules = model?.attributes?.find((attr) => attr.type === "auth")?.properties?.rules ?? [];

  const hasPublicIamRead = rules.some((rule) => {
    const operations = Array.isArray(rule.operations) ? rule.operations : [];
    return rule.allow === "public" && rule.provider === "iam" && operations.includes("read");
  });

  expectCondition(
    hasPublicIamRead,
    `Model ${modelName} must allow public IAM read in amplify_outputs.json.`
  );
};

const ensureField = (model, modelName, fieldName) => {
  const fields = model?.fields ?? {};
  expectCondition(
    Object.prototype.hasOwnProperty.call(fields, fieldName),
    `Model ${modelName} must include field ${fieldName} in amplify_outputs.json.`
  );
};

const outputs = readJson("amplify_outputs.json");
const appText = readText("src/App.tsx");
const specText = readText("SPEC.md");

expectCondition(
  outputs.auth?.unauthenticated_identities_enabled === true,
  "auth.unauthenticated_identities_enabled must be true for public access."
);

const authorizationTypes = outputs.data?.authorization_types ?? [];
expectCondition(
  authorizationTypes.includes("AWS_IAM"),
  "data.authorization_types must include AWS_IAM."
);

const models = outputs.data?.model_introspection?.models ?? {};

ensurePublicReadRule(models.Event, "Event");
ensurePublicReadRule(models.PublicProfile, "PublicProfile");
ensurePublicReadRule(models.MatchResult, "MatchResult");
ensurePublicReadRule(models.FiscalYearLeaderboard, "FiscalYearLeaderboard");

ensureField(models.PublicProfile, "PublicProfile", "identityType");
ensureField(models.PublicProfile, "PublicProfile", "createdBy");
ensureField(models.PrivateProfile, "PrivateProfile", "identityType");
ensureField(models.PrivateProfile, "PrivateProfile", "createdBy");

expectCondition(
  appText.includes('path="/admin/*"'),
  "App routes must include /admin/* for authenticated admin pages."
);
expectCondition(
  !appText.includes("security-setup"),
  "App routes must not include deprecated security-setup path."
);

expectCondition(
  specText.includes("AuthMigrationStatus (Legacy)"),
  "SPEC must keep AuthMigrationStatus as Legacy for data preservation policy."
);

console.log("Phase 8 preflight checks passed.");
