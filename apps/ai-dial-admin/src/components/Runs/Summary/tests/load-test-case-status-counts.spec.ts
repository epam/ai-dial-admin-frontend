import { beforeEach, describe, expect, test, vi } from 'vitest';

import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import { loadTestCaseStatusCounts } from '../load-test-case-status-counts';

const executeStructuredQueryMock = vi.fn<(query: StructuredQuery) => Promise<unknown>>();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: (query: StructuredQuery) => executeStructuredQueryMock(query),
}));

const SCORE_ROWS = {
  rows: [
    { execution_status: 'SUCCESS', passed: true, count: 6 },
    { execution_status: 'SUCCESS', passed: false, count: 3 },
    { execution_status: 'FAILED', passed: null, count: 1 },
  ],
};

const execution = (testCaseId: string, status: string, count = 1) => ({
  test_case_id: testCaseId,
  execution_status: status,
  count,
});

/** Answers the scores query with `scores` and the executions query with `executions`. */
const mockQueries = (scores: unknown, executions: unknown) => {
  executeStructuredQueryMock.mockImplementation((query: StructuredQuery) =>
    Promise.resolve(query.entity === 'test_case_eval_scores' ? scores : executions),
  );
};

const queriedEntities = () => executeStructuredQueryMock.mock.calls.map(([query]) => query.entity);

describe('loadTestCaseStatusCounts', () => {
  beforeEach(() => {
    executeStructuredQueryMock.mockReset();
  });

  test('uses the scores and makes no execution query when the run has score rows', async () => {
    mockQueries(SCORE_ROWS, { rows: [execution('a', 'SUCCESS')] });

    const result = await loadTestCaseStatusCounts({ runId: 'run-1', testCaseCount: 99 });

    expect(result).toEqual({
      counts: { passed: 6, failed: 3, error: 1, unscored: 0, total: 10 },
      hasScoreRows: true,
    });
    expect(queriedEntities()).toEqual(['test_case_eval_scores']);
  });

  test('falls back to executions when the scores come back empty', async () => {
    mockQueries({ rows: [] }, { rows: [execution('a', 'SUCCESS'), execution('b', 'SUCCESS')] });

    const result = await loadTestCaseStatusCounts({ runId: 'run-1' });

    expect(result).toEqual({
      counts: { passed: 0, failed: 0, error: 0, unscored: 2, total: 2 },
      hasScoreRows: false,
    });
    expect(queriedEntities()).toEqual(['test_case_eval_scores', 'eval_summaries']);
  });

  test('counts repeat executions of one test case once', async () => {
    mockQueries({ rows: [] }, { rows: [execution('a', 'SUCCESS', 3), execution('b', 'SUCCESS', 3)] });

    const { counts } = await loadTestCaseStatusCounts({ runId: 'run-1', testCaseCount: 2 });

    expect(counts).toEqual({ passed: 0, failed: 0, error: 0, unscored: 2, total: 2 });
  });

  test('does not complete a test case with a failed execution among its successes', async () => {
    mockQueries(
      { rows: [] },
      { rows: [execution('a', 'SUCCESS'), execution('a', 'FAILED'), execution('b', 'SUCCESS', 2)] },
    );

    const { counts } = await loadTestCaseStatusCounts({ runId: 'run-1', testCaseCount: 2 });

    expect(counts).toEqual({ passed: 0, failed: 0, error: 1, unscored: 1, total: 2 });
  });

  test('counts a test case with no execution as N/A when the run reports its test cases', async () => {
    mockQueries({ rows: [] }, { rows: [execution('a', 'SUCCESS')] });

    const { counts } = await loadTestCaseStatusCounts({ runId: 'run-1', testCaseCount: 3 });

    expect(counts).toEqual({ passed: 0, failed: 0, error: 2, unscored: 1, total: 3 });
  });

  test('uses the folded total when the run does not report its test cases', async () => {
    mockQueries({ rows: [] }, { rows: [execution('a', 'SUCCESS'), execution('b', 'FAILED')] });

    const { counts } = await loadTestCaseStatusCounts({ runId: 'run-1' });

    expect(counts).toEqual({ passed: 0, failed: 0, error: 1, unscored: 1, total: 2 });
  });

  test('never reports fewer test cases than it saw', async () => {
    mockQueries({ rows: [] }, { rows: [execution('a', 'SUCCESS'), execution('b', 'SUCCESS')] });

    const { counts } = await loadTestCaseStatusCounts({ runId: 'run-1', testCaseCount: 1 });

    expect(counts.total).toBe(2);
  });

  test('reports a run that reports test cases but has no executions as all N/A', async () => {
    mockQueries({ rows: [] }, { rows: [] });

    const { counts } = await loadTestCaseStatusCounts({ runId: 'run-1', testCaseCount: 4 });

    expect(counts).toEqual({ passed: 0, failed: 0, error: 4, unscored: 0, total: 4 });
  });

  test('returns empty counts, so the cards error, when the execution query fails', async () => {
    mockQueries({ rows: [] }, null);

    const result = await loadTestCaseStatusCounts({ runId: 'run-1', testCaseCount: 4 });

    expect(result).toEqual({
      counts: { passed: 0, failed: 0, error: 0, unscored: 0, total: 0 },
      hasScoreRows: false,
    });
  });

  test('falls back to executions when the scores query fails', async () => {
    mockQueries(null, { rows: [execution('a', 'SUCCESS')] });

    const { counts, hasScoreRows } = await loadTestCaseStatusCounts({ runId: 'run-1' });

    expect(counts.total).toBe(1);
    expect(hasScoreRows).toBe(false);
  });

  test('scopes each query to the run and applies the matched-only exclusions to the right one', async () => {
    mockQueries({ rows: [] }, { rows: [execution('a', 'SUCCESS')] });

    await loadTestCaseStatusCounts({
      runId: 'run-1',
      excludeTestCaseIds: ['case-x'],
      excludeEvalSummaryIds: ['summary-x'],
    });

    const [scoresQuery, executionsQuery] = executeStructuredQueryMock.mock.calls.map(([query]) =>
      JSON.stringify(query.filter),
    );
    expect(scoresQuery).toContain('run-1');
    expect(scoresQuery).toContain('case-x');
    expect(scoresQuery).not.toContain('summary-x');
    expect(executionsQuery).toContain('run-1');
    expect(executionsQuery).toContain('summary-x');
    expect(executionsQuery).not.toContain('case-x');
  });
});
