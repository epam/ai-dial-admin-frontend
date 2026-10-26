import { COUNT_ALIAS, EXECUTION_STATUS_FIELD } from '@/src/components/Runs/Summary/constants';
import { PASSED_FIELD, RUN_ID_FIELD } from '@/src/components/TestSuites/Trends/constants';
import { RunTestCaseSegments, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { toCount } from '@/src/utils/formatting/number-formatting';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';

const isPassedTrue = (value: unknown): boolean => value === true || value === 'true';

const isPassedFalse = (value: unknown): boolean => value === false || value === 'false';

const emptySegments = (point: TrendsRunPoint): RunTestCaseSegments => ({
  runId: point.runId,
  runName: point.runName,
  above: 0,
  below: 0,
  errorOrNa: 0,
  total: 0,
});

export const parseRunTestCaseSegments = (
  result: StructuredQueryResult | null,
  runOrder: TrendsRunPoint[],
  hasThreshold = true,
): RunTestCaseSegments[] => {
  const byRun = new Map<string, RunTestCaseSegments>();
  for (const point of runOrder) {
    byRun.set(point.runId, emptySegments(point));
  }

  for (const row of result?.rows ?? []) {
    const runId = row[RUN_ID_FIELD];
    if (typeof runId !== 'string') {
      continue;
    }
    let segments = byRun.get(runId);
    if (!segments) {
      segments = {
        runId,
        runName: runId,
        above: 0,
        below: 0,
        errorOrNa: 0,
        total: 0,
      };
      byRun.set(runId, segments);
    }

    const count = toCount(row[COUNT_ALIAS]);
    segments.total += count;

    const status = row[EXECUTION_STATUS_FIELD];
    const passed = row[PASSED_FIELD];

    if (status !== ExtractionResultStatus.SUCCESS) {
      segments.errorOrNa += count;
      continue;
    }

    if (!hasThreshold) {
      segments.above += count;
      continue;
    }

    if (isPassedTrue(passed)) {
      segments.above += count;
    } else if (isPassedFalse(passed)) {
      segments.below += count;
    } else {
      // SUCCESS with null/unknown passed — N/A (threshold set but row unscored).
      segments.errorOrNa += count;
    }
  }

  return runOrder.map((point) => byRun.get(point.runId)!);
};

export const fillEmptySegmentsFromOverallScore = (
  segments: RunTestCaseSegments[],
  runOrder: TrendsRunPoint[],
  threshold: number | null | undefined,
): RunTestCaseSegments[] => {
  const byId = new Map(runOrder.map((point) => [point.runId, point]));

  return segments.map((seg) => {
    if (seg.total > 0) {
      return seg;
    }
    const point = byId.get(seg.runId);
    if (!point) {
      return seg;
    }
    if (point.isFailed || point.overallScore == null) {
      return { ...seg, errorOrNa: 1, total: 1 };
    }
    if (threshold == null) {
      return { ...seg, above: 1, total: 1 };
    }
    if (point.overallScore >= threshold) {
      return { ...seg, above: 1, total: 1 };
    }
    return { ...seg, below: 1, total: 1 };
  });
};
