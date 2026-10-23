import {
  TEST_CASE_NAME_FIELD,
  TEST_CASE_SCORE_FIELD,
  TEST_CASE_SCORE_ROW_LIMIT,
} from '@/src/components/Runs/ExecutionResults/constants';
import {
  TestCaseScoreLookup,
  TestCaseScoreSummary,
  TestCaseThresholdStatus,
} from '@/src/components/Runs/ExecutionResults/models';
import {
  PASSED_FIELD,
  RUN_ID_FIELD,
  TEST_CASE_EVAL_SCORES_ENTITY,
  TEST_CASE_ID_FIELD,
} from '@/src/components/Runs/Summary/constants';
import { StructuredQuery, StructuredQueryResult, ValueType } from '@/src/models/evaluation/structured-query';
import { col, field, inValues, offsetPage, rowQuery } from '@/src/utils/structured-query/build';

export const buildTestCaseScoresQuery = (runIds: string[]): StructuredQuery =>
  rowQuery({
    entity: TEST_CASE_EVAL_SCORES_ENTITY,
    select: [
      col(field(RUN_ID_FIELD)),
      col(field(TEST_CASE_ID_FIELD)),
      col(field(TEST_CASE_NAME_FIELD)),
      col(field(TEST_CASE_SCORE_FIELD)),
      col(field(PASSED_FIELD)),
    ],
    filter: inValues(RUN_ID_FIELD, ValueType.Uuid, runIds),
    page: offsetPage(0, TEST_CASE_SCORE_ROW_LIMIT, false),
  });

const parseOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const parseScore = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const parsePassed = (value: unknown): boolean | null => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
};

export const parseTestCaseScores = (result: StructuredQueryResult | null): TestCaseScoreSummary[] =>
  (result?.rows ?? []).flatMap((row) => {
    const runId = parseOptionalString(row[RUN_ID_FIELD]);
    if (!runId) return [];

    return [
      {
        runId,
        testCaseId: parseOptionalString(row[TEST_CASE_ID_FIELD]),
        testCaseName: parseOptionalString(row[TEST_CASE_NAME_FIELD]),
        score: parseScore(row[TEST_CASE_SCORE_FIELD]),
        passed: parsePassed(row[PASSED_FIELD]),
      },
    ];
  });

export const getTestCaseThresholdStatus = (
  score: number | null | undefined,
  threshold: number | null | undefined,
): TestCaseThresholdStatus => {
  if (score == null || threshold == null) return TestCaseThresholdStatus.NotApplicable;
  return score >= threshold ? TestCaseThresholdStatus.Pass : TestCaseThresholdStatus.Fail;
};

export const buildTestCaseScoreLookup = (summaries: TestCaseScoreSummary[]): TestCaseScoreLookup => {
  const byId = new Map<string, TestCaseScoreSummary>();
  const byName = new Map<string, TestCaseScoreSummary>();

  summaries.forEach((summary) => {
    if (summary.testCaseId) byId.set(`${summary.runId}::${summary.testCaseId}`, summary);
    if (summary.testCaseName) byName.set(`${summary.runId}::${summary.testCaseName}`, summary);
  });

  return (runId, testCaseId, testCaseName) => {
    if (testCaseId) {
      const idMatch = byId.get(`${runId}::${testCaseId}`);
      if (idMatch) return idMatch;
    }
    return testCaseName ? byName.get(`${runId}::${testCaseName}`) : undefined;
  };
};
