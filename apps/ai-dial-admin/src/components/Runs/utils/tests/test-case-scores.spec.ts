import { describe, expect, test, vi } from 'vitest';

import { TEST_CASE_SCORE_ROW_LIMIT } from '@/src/components/Runs/constants';
import { OverallScoreThresholdStatus, TestCaseScoreSummary } from '@/src/components/Runs/models';
import {
  attachTestCaseScores,
  buildTestCaseScoreLookup,
  buildTestCaseScoresQuery,
  getOverallScoreThresholdStatus,
  getOverallScoreThresholdMessage,
  getRoundedTestCaseScore,
  parseScoreRaw,
  parseTestCaseScores,
} from '@/src/components/Runs/utils/test-case-scores';
import { AnalyticsResult } from '@/src/models/evaluation/run';
import { ComparisonOp, ExprType, QueryMode } from '@/src/models/evaluation/structured-query';

const RUN_A = 'run-a';
const RUN_B = 'run-b';

const summary = (overrides: Partial<TestCaseScoreSummary>): TestCaseScoreSummary => ({
  runId: RUN_A,
  score: 0.5,
  passed: true,
  ...overrides,
});

const row = (overrides: Partial<AnalyticsResult>): AnalyticsResult => ({
  responseStatusCode: 200,
  runIndex: 0,
  ...overrides,
});

describe('buildTestCaseScoresQuery', () => {
  test('selects the score columns for every given run in one row query', () => {
    const query = buildTestCaseScoresQuery([RUN_A, RUN_B]);

    expect(query.entity).toBe('test_case_eval_scores');
    expect(query.mode).toBe(QueryMode.Row);
    expect((query.select ?? []).map((column) => (column.expr as { name: string }).name)).toEqual([
      'test_suite_run_id',
      'test_case_id',
      'test_case_name',
      'score',
      'passed',
    ]);
    expect(query.page).toMatchObject({ offset: 0, limit: TEST_CASE_SCORE_ROW_LIMIT });
  });

  test('filters by membership of all run ids', () => {
    const query = buildTestCaseScoresQuery([RUN_A, RUN_B]);
    const filter = query.filter as {
      op: ComparisonOp;
      args: [unknown, { type: ExprType; items: { value: string }[] }];
    };

    expect(filter.op).toBe(ComparisonOp.In);
    expect(filter.args[1].type).toBe(ExprType.Array);
    expect(filter.args[1].items.map((item) => item.value)).toEqual([RUN_A, RUN_B]);
  });
});

describe('parseTestCaseScores', () => {
  test('maps rows to summaries', () => {
    const result = parseTestCaseScores({
      rows: [
        {
          test_suite_run_id: RUN_A,
          test_case_id: 'tc-1',
          test_case_name: 'Row01',
          score: 0.7,
          passed: true,
        },
      ],
    });

    expect(result).toEqual([{ runId: RUN_A, testCaseId: 'tc-1', testCaseName: 'Row01', score: 0.7, passed: true }]);
  });

  test('drops rows without a run id', () => {
    expect(parseTestCaseScores({ rows: [{ test_case_id: 'tc-1', score: 1 }, { test_suite_run_id: '' }] })).toEqual([]);
  });

  test('turns a non-finite or non-numeric score into null and keeps a zero score', () => {
    const result = parseTestCaseScores({
      rows: [
        { test_suite_run_id: RUN_A, score: Number.NaN },
        { test_suite_run_id: RUN_A, score: '0.7' },
        { test_suite_run_id: RUN_A, score: null },
        { test_suite_run_id: RUN_A, score: 0 },
      ],
    });

    expect(result.map((item) => item.score)).toEqual([null, null, null, 0]);
  });

  test('parses boolean and string passed values, otherwise null', () => {
    const result = parseTestCaseScores({
      rows: [
        { test_suite_run_id: RUN_A, passed: true },
        { test_suite_run_id: RUN_A, passed: 'false' },
        { test_suite_run_id: RUN_A, passed: 'true' },
        { test_suite_run_id: RUN_A, passed: 'maybe' },
      ],
    });

    expect(result.map((item) => item.passed)).toEqual([true, false, true, null]);
  });

  test.each([[null], [undefined], [{ rows: [] }]])('returns an empty list for %j', (input) => {
    expect(parseTestCaseScores(input)).toEqual([]);
  });
});

describe('buildTestCaseScoreLookup', () => {
  const lookup = buildTestCaseScoreLookup([
    summary({ testCaseId: 'tc-1', testCaseName: 'Row01', score: 0.9 }),
    summary({ testCaseId: 'tc-2', testCaseName: 'Row02', score: 0.2 }),
    summary({ runId: RUN_B, testCaseId: 'tc-1', testCaseName: 'Row01', score: 0.4 }),
  ]);

  test('matches by test case id within the run', () => {
    expect(lookup(RUN_A, 'tc-1', 'other name')?.score).toBe(0.9);
    expect(lookup(RUN_B, 'tc-1')?.score).toBe(0.4);
  });

  test('falls back to the name when the id is unknown', () => {
    expect(lookup(RUN_A, 'unknown-id', 'Row02')?.score).toBe(0.2);
    expect(lookup(RUN_A, undefined, 'Row02')?.score).toBe(0.2);
  });

  test('prefers the id match over a name match', () => {
    expect(lookup(RUN_A, 'tc-1', 'Row02')?.score).toBe(0.9);
  });

  test('does not match across runs or without an identity', () => {
    expect(lookup('run-c', 'tc-1', 'Row01')).toBeUndefined();
    expect(lookup(RUN_A)).toBeUndefined();
  });
});

describe('attachTestCaseScores', () => {
  const lookup = buildTestCaseScoreLookup([summary({ testCaseId: 'tc-1', score: 0.7 })]);

  test('gives every row of a test case the same score', () => {
    const rows = [row({ testCaseId: 'tc-1', runIndex: 0 }), row({ testCaseId: 'tc-1', runIndex: 1 })];

    expect(attachTestCaseScores(rows, lookup, RUN_A).map((item) => item.testCaseScore)).toEqual([0.7, 0.7]);
  });

  test('uses null for a test case without a score', () => {
    expect(attachTestCaseScores([row({ testCaseId: 'tc-9' })], lookup, RUN_A)[0].testCaseScore).toBeNull();
  });

  test('uses null when the matched summary has no score', () => {
    const emptyScore = buildTestCaseScoreLookup([summary({ testCaseId: 'tc-1', score: null })]);

    expect(attachTestCaseScores([row({ testCaseId: 'tc-1' })], emptyScore, RUN_A)[0].testCaseScore).toBeNull();
  });

  test('keeps a zero score', () => {
    const zero = buildTestCaseScoreLookup([summary({ testCaseId: 'tc-1', score: 0 })]);

    expect(attachTestCaseScores([row({ testCaseId: 'tc-1' })], zero, RUN_A)[0].testCaseScore).toBe(0);
  });

  test('returns copies and leaves the input rows untouched', () => {
    const input = row({ testCaseId: 'tc-1' });
    const [output] = attachTestCaseScores([input], lookup, RUN_A);

    expect(output).not.toBe(input);
    expect(input).not.toHaveProperty('testCaseScore');
  });
});

describe('getOverallScoreThresholdStatus', () => {
  test.each([
    [0.7, 0.6, OverallScoreThresholdStatus.Above],
    [0.6, 0.6, OverallScoreThresholdStatus.Above],
    [0.5, 0.6, OverallScoreThresholdStatus.Below],
    [0, 0.6, OverallScoreThresholdStatus.Below],
    [0, 0, OverallScoreThresholdStatus.Above],
  ])('score %s against threshold %s is %s', (score, threshold, expected) => {
    expect(getOverallScoreThresholdStatus(score, threshold)).toBe(expected);
  });

  test.each([
    [null, 0.6],
    [undefined, 0.6],
    [0.7, null],
    [0.7, undefined],
    [null, null],
  ])('score %s against threshold %s has nothing to compare', (score, threshold) => {
    expect(getOverallScoreThresholdStatus(score, threshold)).toBe(OverallScoreThresholdStatus.None);
  });
});

describe('getRoundedTestCaseScore', () => {
  test('rounds to three decimals and drops trailing zeros', () => {
    expect(getRoundedTestCaseScore(0.92857)).toBe(0.929);
    expect(getRoundedTestCaseScore(0.7)).toBe(0.7);
    expect(getRoundedTestCaseScore(1)).toBe(1);
  });

  test('keeps zero and maps a missing score to undefined', () => {
    expect(getRoundedTestCaseScore(0)).toBe(0);
    expect(getRoundedTestCaseScore(null)).toBeUndefined();
    expect(getRoundedTestCaseScore(undefined)).toBeUndefined();
  });
});

describe('parseScoreRaw', () => {
  test.each([
    ['0.7', 0.7],
    ['0', 0],
    [' 1 ', 1],
  ])('reads %j as %s', (raw, expected) => {
    expect(parseScoreRaw(raw)).toBe(expected);
  });

  test.each([[null], [undefined], [''], ['  '], ['n/a'], ['Infinity']])('reads %j as no score', (raw) => {
    expect(parseScoreRaw(raw)).toBeNull();
  });
});

describe('getOverallScoreThresholdMessage', () => {
  // The mocked `t` returns the key as-is, so the message names which result was picked.
  const t = (key: string) => key;

  test('picks the above message at or over the threshold and the below message under it', () => {
    expect(getOverallScoreThresholdMessage(t, 0.7, 0.6)).toBe('Runs.TestCaseOverallScoreAboveThresholdTooltip');
    expect(getOverallScoreThresholdMessage(t, 0.6, 0.6)).toBe('Runs.TestCaseOverallScoreAboveThresholdTooltip');
    expect(getOverallScoreThresholdMessage(t, 0, 0.6)).toBe('Runs.TestCaseOverallScoreBelowThresholdTooltip');
  });

  test('passes the threshold as stored, unpadded', () => {
    const translate = vi.fn((key: string) => key);

    getOverallScoreThresholdMessage(translate, 0.7, 0.6);

    expect(translate).toHaveBeenCalledWith(expect.any(String), { threshold: '0.6' });
  });

  test.each([
    [null, 0.6],
    [undefined, 0.6],
    [0.7, null],
    [0.7, undefined],
  ])('has no message for score %s against threshold %s', (score, threshold) => {
    expect(getOverallScoreThresholdMessage(t, score, threshold)).toBeUndefined();
  });
});
