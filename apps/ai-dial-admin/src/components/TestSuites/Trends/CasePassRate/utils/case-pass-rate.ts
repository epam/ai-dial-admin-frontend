import { RUN_LABEL_FALLBACK_LENGTH } from '@/src/components/TestSuites/Trends/CasePassRate/constants';
import {
  CasePassRateBar,
  CasePassRateLatestDetail,
  CasePassRateSeries,
  CasePassRateSegment,
  CasePassRateSegmentKind,
} from '@/src/components/TestSuites/Trends/models';
import { CasePassRateResponse, CasePassRateRun } from '@/src/models/evaluation/case-pass-rate';
import { Run } from '@/src/models/evaluation/run';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

/**
 * Non-zero groups only, bottom-up. A zero group is dropped rather than kept at 0% so the bar
 * renders no sliver for it.
 */
const buildSegments = (run: CasePassRateRun): CasePassRateSegment[] => {
  const groups: [CasePassRateSegmentKind, number][] = [
    [CasePassRateSegmentKind.Passed, run.successPassedCount],
    [CasePassRateSegmentKind.Failed, run.successNotPassedCount],
    [CasePassRateSegmentKind.Errored, run.failedCount],
    [CasePassRateSegmentKind.NotScored, run.successNoVerdictCount],
  ];

  return groups
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => ({ kind, percent: run.totalCount > 0 ? (count / run.totalCount) * 100 : 0 }));
};

const buildLabel = (run: CasePassRateRun, matchedRun: Run | undefined): string =>
  matchedRun?.testRunName || run.testSuiteRunId.slice(0, RUN_LABEL_FALLBACK_LENGTH);

/**
 * Folds the case-pass-rate response and the suite's runs into Cases Passed bars, oldest first.
 *
 * Only the runs list can name a run, so the bar takes all of its run metadata from there rather
 * than reading the DTO's own `status` and `runCreatedAtMs`; a run absent from the list keeps its
 * counts and loses the rest, including the href that makes its bar interactive.
 *
 * Order comes from reversing the endpoint's newest-first array rather than sorting on a timestamp,
 * so bars stay in the order the backend ranked them even for runs the join did not resolve.
 */
export const buildCasePassRateBars = (response: CasePassRateResponse, runs: Run[]): CasePassRateBar[] => {
  const runsById = new Map(runs.filter((run) => run.id).map((run) => [run.id as string, run]));

  return [...response.runs].reverse().map((run) => {
    const matchedRun = runsById.get(run.testSuiteRunId);
    const countedRows =
      run.successPassedCount + run.successNotPassedCount + run.failedCount + run.successNoVerdictCount;

    return {
      runId: run.testSuiteRunId,
      label: buildLabel(run, matchedRun),
      createdAtMs: matchedRun?.createdAt ?? matchedRun?.startedAt ?? null,
      status: matchedRun?.status,
      passedCount: run.successPassedCount,
      failedCount: run.successNotPassedCount,
      erroredCount: run.failedCount,
      notScoredCount: run.successNoVerdictCount,
      totalCount: run.totalCount,
      notRunCount: Math.max(run.totalCount - countedRows, 0),
      segments: buildSegments(run),
      href: matchedRun ? getUrnForEntity(ApplicationRoute.Runs, matchedRun) : null,
    };
  });
};

/**
 * The newest bar plus its comparison against the run before it. `null` for an empty window — the
 * readout describes one run, never an aggregate.
 */
export const getLatestRunDetail = (bars: CasePassRateBar[]): CasePassRateLatestDetail | null => {
  const bar = bars[bars.length - 1];
  if (!bar) {
    return null;
  }

  const previous = bars[bars.length - 2];

  return {
    bar,
    passedDelta: previous ? bar.passedCount - previous.passedCount : null,
    // No verdict was reached either way, and at least one row went unscored. Errored rows are
    // excluded deliberately: a run that failed to execute has not told us anything about scoring.
    isLackingScoring: bar.passedCount + bar.failedCount === 0 && bar.notScoredCount > 0,
  };
};

/**
 * `buildCasePassRateBars` guarded for a response the panel cannot use — a failed request, or a body
 * with no `runs` array. Returns `null` for both, the panel's "unavailable" state; an empty array
 * would instead claim the suite has no runs. Guarding here keeps that distinction in one place and
 * keeps a malformed body from taking the rest of the Trends tab down with it.
 *
 * The `catch` swallows a defect in the build as readily as a bad row, so it logs rather than
 * failing silently.
 */
export const buildCasePassRateSeries = (
  response: CasePassRateResponse | null,
  runs: Run[],
): CasePassRateSeries | null => {
  if (!Array.isArray(response?.runs)) {
    return null;
  }

  try {
    return buildCasePassRateBars(response, runs);
  } catch (error) {
    console.error('Building the case pass rate series failed', error);
    return null;
  }
};
