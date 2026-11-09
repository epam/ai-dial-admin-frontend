import {
  TEST_CASE_NAME_FIELD,
  TEST_CASE_SCORE_FIELD,
  TEST_CASE_SCORE_ROW_LIMIT,
} from '@/src/components/Runs/constants';
import { OverallScoreThresholdStatus, TestCaseScoreLookup, TestCaseScoreSummary } from '@/src/components/Runs/models';
import {
  PASSED_FIELD,
  RUN_ID_FIELD,
  TEST_CASE_EVAL_SCORES_ENTITY,
  TEST_CASE_ID_FIELD,
} from '@/src/components/Runs/Summary/constants';
import { SCORE_FRACTION_DIGITS } from '@/src/components/Runs/Summary/Cards/constants';
import { formatThreshold } from '@/src/components/Runs/Summary/Cards/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { Translate } from '@/src/models/error';
import { AnalyticsResult } from '@/src/models/evaluation/run';
import { StructuredQuery, StructuredQueryResult, ValueType } from '@/src/models/evaluation/structured-query';
import { col, field, inValues, offsetPage, rowQuery } from '@/src/utils/structured-query/build';

/** One row per test case per run, for every run in `runIds`. */
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

export const parseTestCaseScores = (result: StructuredQueryResult | null | undefined): TestCaseScoreSummary[] =>
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

/** Matches by test case id first, then by name — the same two-step identity the compare merge uses. */
export const buildTestCaseScoreLookup = (summaries: TestCaseScoreSummary[]): TestCaseScoreLookup => {
  const byId = new Map<string, TestCaseScoreSummary>();
  const byName = new Map<string, TestCaseScoreSummary>();

  summaries.forEach((summary) => {
    if (summary.testCaseId) byId.set(`${summary.runId}::${summary.testCaseId}`, summary);
    if (summary.testCaseName) byName.set(`${summary.runId}::${summary.testCaseName}`, summary);
  });

  return (runId, testCaseId, testCaseName) => {
    const idMatch = testCaseId ? byId.get(`${runId}::${testCaseId}`) : undefined;
    if (idMatch) return idMatch;
    return testCaseName ? byName.get(`${runId}::${testCaseName}`) : undefined;
  };
};

/** Returns copies of `rows` carrying `testCaseScore`; `null` when the test case has no score. */
export const attachTestCaseScores = <T extends AnalyticsResult>(
  rows: T[],
  lookup: TestCaseScoreLookup,
  runId: string,
): T[] =>
  rows.map((row) => ({
    ...row,
    testCaseScore: lookup(runId, row.testCaseId, row.testCaseName)?.score ?? null,
  }));

/** A missing score or an absent (or enabled-but-empty) threshold has nothing to compare. */
export const getOverallScoreThresholdStatus = (
  score: number | null | undefined,
  threshold: number | null | undefined,
): OverallScoreThresholdStatus => {
  if (score == null || threshold == null) return OverallScoreThresholdStatus.None;
  return score >= threshold ? OverallScoreThresholdStatus.Above : OverallScoreThresholdStatus.Below;
};

/** Same rounding as the metric columns: three decimals, trailing zeros dropped. */
export const getRoundedTestCaseScore = (score: number | null | undefined): number | undefined =>
  score == null ? undefined : +score.toFixed(SCORE_FRACTION_DIGITS);

/** A score written as text (a row-detail raw value); `null` when it is missing or not a number. */
export const parseScoreRaw = (raw: string | null | undefined): number | null => {
  if (raw == null || raw.trim() === '') return null;
  const score = Number(raw);
  return Number.isFinite(score) ? score : null;
};

/** "The test case's overall score is above/below the threshold (0.6)."; `undefined` when there is nothing to compare. */
export const getOverallScoreThresholdMessage = (
  t: Translate,
  score: number | null | undefined,
  threshold: number | null | undefined,
): string | undefined => {
  const status = getOverallScoreThresholdStatus(score, threshold);
  if (threshold == null || status === OverallScoreThresholdStatus.None) return undefined;

  return t(
    status === OverallScoreThresholdStatus.Above
      ? RunsI18nKey.TestCaseOverallScoreAboveThresholdTooltip
      : RunsI18nKey.TestCaseOverallScoreBelowThresholdTooltip,
    { threshold: formatThreshold(threshold) },
  );
};
