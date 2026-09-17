import { describe, expect, test } from 'vitest';

import {
  buildCasePassRateBars,
  buildCasePassRateSeries,
  getLatestRunDetail,
} from '@/src/components/TestSuites/Trends/CasePassRate/utils/case-pass-rate';
import { CasePassRateBar, CasePassRateSegmentKind } from '@/src/components/TestSuites/Trends/models';
import { CasePassRateResponse, CasePassRateRun } from '@/src/models/evaluation/case-pass-rate';
import { Run, RunStatus } from '@/src/models/evaluation/run';

const run = (overrides: Partial<CasePassRateRun> = {}): CasePassRateRun => ({
  testSuiteRunId: 'run-1',
  failedCount: 1,
  successPassedCount: 25,
  successNotPassedCount: 3,
  successNoVerdictCount: 0,
  totalCount: 29,
  ...overrides,
});

/** Newest first, the order the endpoint returns. */
const response = (runs: CasePassRateRun[]): CasePassRateResponse => ({ testSuiteId: 'suite-1', runs });

const bar = (overrides: Partial<CasePassRateBar> = {}): CasePassRateBar => ({
  runId: 'run-1',
  label: 'run-1',
  createdAtMs: 1_000,
  status: RunStatus.COMPLETED,
  passedCount: 10,
  failedCount: 0,
  erroredCount: 0,
  notScoredCount: 0,
  totalCount: 10,
  notRunCount: 0,
  segments: [],
  href: null,
  ...overrides,
});

describe('buildCasePassRateBars', () => {
  test('reverses the endpoint order so the oldest run comes first', () => {
    const bars = buildCasePassRateBars(
      response([
        run({ testSuiteRunId: 'newest' }),
        run({ testSuiteRunId: 'middle' }),
        run({ testSuiteRunId: 'oldest' }),
      ]),
      [],
    );

    expect(bars.map((entry) => entry.runId)).toEqual(['oldest', 'middle', 'newest']);
  });

  test('labels a bar with the run name and links it to the run detail page', () => {
    const runs: Run[] = [{ id: 'run-1', testRunName: 'nightly-42' }];

    const [entry] = buildCasePassRateBars(response([run()]), runs);

    expect(entry.label).toBe('nightly-42');
    expect(entry.href).toBe('/runs/nightly-42?id=run-1');
  });

  test('takes the creation date and status from the joined run', () => {
    const runs: Run[] = [{ id: 'run-1', createdAt: 1_726_400_000_000, status: RunStatus.RUNNING }];

    const [entry] = buildCasePassRateBars(response([run()]), runs);

    expect(entry.createdAtMs).toBe(1_726_400_000_000);
    expect(entry.status).toBe(RunStatus.RUNNING);
  });

  test('falls back to the joined run start time when it has no creation time', () => {
    const runs: Run[] = [{ id: 'run-1', startedAt: 500 }];

    const [entry] = buildCasePassRateBars(response([run()]), runs);

    expect(entry.createdAtMs).toBe(500);
  });

  test('falls back to a short run-id label when the run has no name', () => {
    const runs: Run[] = [{ id: 'abcdef1234567890' }];

    const [entry] = buildCasePassRateBars(response([run({ testSuiteRunId: 'abcdef1234567890' })]), runs);

    expect(entry.label).toBe('abcdef12');
  });

  test('leaves href, date and status unset for a run absent from the runs list', () => {
    const [entry] = buildCasePassRateBars(response([run()]), []);

    expect(entry.href).toBeNull();
    expect(entry.createdAtMs).toBeNull();
    expect(entry.status).toBeUndefined();
  });

  test('stacks the four non-zero groups bottom-up as proportions of the run total', () => {
    const [entry] = buildCasePassRateBars(
      response([
        run({
          successPassedCount: 20,
          successNotPassedCount: 10,
          failedCount: 5,
          successNoVerdictCount: 5,
          totalCount: 40,
        }),
      ]),
      [],
    );

    expect(entry.segments).toEqual([
      { kind: CasePassRateSegmentKind.Passed, percent: 50 },
      { kind: CasePassRateSegmentKind.Failed, percent: 25 },
      { kind: CasePassRateSegmentKind.Errored, percent: 12.5 },
      { kind: CasePassRateSegmentKind.NotScored, percent: 12.5 },
    ]);
  });

  test('keeps errored and not-scored rows in separate groups', () => {
    const [entry] = buildCasePassRateBars(
      response([
        run({
          successPassedCount: 10,
          successNotPassedCount: 0,
          failedCount: 3,
          successNoVerdictCount: 7,
          totalCount: 20,
        }),
      ]),
      [],
    );

    expect(entry.erroredCount).toBe(3);
    expect(entry.notScoredCount).toBe(7);
  });

  test('omits a zero-count group from the segments', () => {
    const [entry] = buildCasePassRateBars(
      response([
        run({
          successPassedCount: 10,
          successNotPassedCount: 0,
          failedCount: 0,
          successNoVerdictCount: 0,
          totalCount: 10,
        }),
      ]),
      [],
    );

    expect(entry.segments).toEqual([{ kind: CasePassRateSegmentKind.Passed, percent: 100 }]);
  });

  test('reports the unresolved remainder when the groups sum below the run total', () => {
    const [entry] = buildCasePassRateBars(
      response([
        run({
          successPassedCount: 15,
          successNotPassedCount: 5,
          failedCount: 4,
          successNoVerdictCount: 0,
          totalCount: 30,
        }),
      ]),
      [],
    );

    expect(entry.notRunCount).toBe(6);
  });

  test('clamps the remainder at zero when the groups exceed the run total', () => {
    const [entry] = buildCasePassRateBars(response([run({ totalCount: 1 })]), []);

    expect(entry.notRunCount).toBe(0);
  });

  test('yields no segments for a run with no rows', () => {
    const [entry] = buildCasePassRateBars(
      response([
        run({
          successPassedCount: 0,
          successNotPassedCount: 0,
          failedCount: 0,
          successNoVerdictCount: 0,
          totalCount: 0,
        }),
      ]),
      [],
    );

    expect(entry.segments).toEqual([]);
    expect(entry.notRunCount).toBe(0);
  });

  test('returns an empty list when the suite has no runs', () => {
    expect(buildCasePassRateBars(response([]), [])).toEqual([]);
  });
});

describe('getLatestRunDetail', () => {
  test.each([
    ['a positive delta against the previous run', 38, 44, 6],
    ['a negative delta when the latest run passed fewer cases', 44, 38, -6],
    ['a zero delta when the passed count did not move', 40, 40, 0],
  ])('reports %s', (_label, previousPassed, latestPassed, expected) => {
    const detail = getLatestRunDetail([bar({ passedCount: previousPassed }), bar({ passedCount: latestPassed })]);

    expect(detail?.bar.passedCount).toBe(latestPassed);
    expect(detail?.passedDelta).toBe(expected);
  });

  test('leaves the delta null for a single-run window', () => {
    expect(getLatestRunDetail([bar({ passedCount: 40 })])?.passedDelta).toBeNull();
  });

  test('returns null for an empty window', () => {
    expect(getLatestRunDetail([])).toBeNull();
  });

  // Lacking scoring means no verdict was reached either way, so a `0 / N` readout would be wrong.
  // Errored rows do not bear on it: a run that failed to execute said nothing about scoring.
  test.each([
    ['the run reached no verdict either way', { notScoredCount: 30 }, true],
    ['some rows errored but none were scored', { erroredCount: 20, notScoredCount: 10 }, true],
    ['a single row passed', { passedCount: 1, notScoredCount: 29 }, false],
    ['a single row failed the threshold', { failedCount: 1, notScoredCount: 29 }, false],
    ['every row errored, so nothing was scored to speak of', { erroredCount: 30 }, false],
    ['the run has no rows at all', { totalCount: 0 }, false],
  ])('flags lacking scoring as %s when %s', (_label, counts, expected) => {
    const detail = getLatestRunDetail([
      bar({ passedCount: 0, failedCount: 0, erroredCount: 0, notScoredCount: 0, totalCount: 30, ...counts }),
    ]);

    expect(detail?.isLackingScoring).toBe(expected);
  });
});

describe('buildCasePassRateSeries', () => {
  test('builds the bars for a well-formed response', () => {
    expect(buildCasePassRateSeries(response([run()]), [])).toHaveLength(1);
  });

  test.each([
    ['a null response', null],
    ['a body carrying no runs array', { testSuiteId: 'suite-1' } as CasePassRateResponse],
    ['a body that is not an object at all', 'Not Found' as unknown as CasePassRateResponse],
  ])('reports unavailable for %s', (_label, response) => {
    expect(buildCasePassRateSeries(response, [])).toBeNull();
  });

  test('distinguishes a suite with no runs from an unusable response', () => {
    expect(buildCasePassRateSeries(response([]), [])).toEqual([]);
  });
});
