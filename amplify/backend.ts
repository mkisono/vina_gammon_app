import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { StartingPosition, EventSourceMapping, Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { updateFiscalYearLeaderboard } from './functions/update-fiscal-year-leaderboard/resource';

const backend = defineBackend({
  auth,
  data,
  updateFiscalYearLeaderboard,
});

const { amplifyDynamoDbTables } = backend.data.resources.cfnResources;
for (const table of Object.values(amplifyDynamoDbTables)) {
  table.pointInTimeRecoveryEnabled = true;
}

// --- DynamoDB table references ---
const matchResultTable = backend.data.resources.tables['MatchResult'];
const eventTable = backend.data.resources.tables['Event'];
const eventUserContributionTable = backend.data.resources.tables['EventUserContribution'];
const fiscalYearLeaderboardTable = backend.data.resources.tables['FiscalYearLeaderboard'];

const lambdaFn = backend.updateFiscalYearLeaderboard.resources.lambda;
const stack = Stack.of(lambdaFn);

// --- IAM: Stream read from MatchResult ---
const streamPolicy = new Policy(stack, 'MatchResultStreamReadPolicy', {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'dynamodb:DescribeStream',
        'dynamodb:GetRecords',
        'dynamodb:GetShardIterator',
        'dynamodb:ListStreams',
      ],
      resources: [matchResultTable.tableStreamArn!],
    }),
  ],
});

// --- IAM: Read Event table (for isTest check) + write MV tables ---
const tableAccessPolicy = new Policy(stack, 'MVTableAccessPolicy', {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:GetItem'],
      resources: [eventTable.tableArn],
    }),
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['dynamodb:GetItem', 'dynamodb:UpdateItem', 'dynamodb:PutItem'],
      resources: [
        eventUserContributionTable.tableArn,
        fiscalYearLeaderboardTable.tableArn,
      ],
    }),
  ],
});

lambdaFn.role?.attachInlinePolicy(streamPolicy);
lambdaFn.role?.attachInlinePolicy(tableAccessPolicy);

// --- EventSourceMapping: MatchResult Stream → Lambda ---
const mapping = new EventSourceMapping(stack, 'MatchResultStreamMapping', {
  target: lambdaFn,
  eventSourceArn: matchResultTable.tableStreamArn!,
  startingPosition: StartingPosition.LATEST,
  bisectBatchOnError: true,
  reportBatchItemFailures: true,
});
mapping.node.addDependency(streamPolicy);

// --- Environment variables injected into Lambda ---
const concreteLambda = lambdaFn as unknown as LambdaFunction;
concreteLambda.addEnvironment('EVENT_TABLE_NAME', eventTable.tableName);
concreteLambda.addEnvironment('EVENT_USER_CONTRIBUTION_TABLE_NAME', eventUserContributionTable.tableName);
concreteLambda.addEnvironment('FISCAL_YEAR_LEADERBOARD_TABLE_NAME', fiscalYearLeaderboardTable.tableName);

