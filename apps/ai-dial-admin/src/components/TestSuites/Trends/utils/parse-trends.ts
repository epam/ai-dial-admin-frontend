import { sortMetricStatistics } from '@/src/components/Common/MetricStatistics/utils';
import { splitMetricName } from '@/src/components/Runs/Summary/utils';
import {
  COMPUTED_AT_MS_FIELD,
  METRIC_NAME_FIELD,
  METRIC_SCORE_NAME_FIELD,
  OVERALL_METRIC_SCORE_NAME,
  RUN_ID_FIELD,
  TRENDS_RUN_WINDOW,
  VALUE_FIELD,
} from '@/src/components/TestSuites/Trends/constants';
import { MetricTrendGroup, TrendsData, TrendsKpiData, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { roundScore } from '@/src/components/TestSuites/Trends/utils/format';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';

const runDurationMs = (run: Run | undefined): number | null => {
  if (run?.startedAt == null || run?.completedAt == null) {
    return null;
  }
  const duration = run.completedAt - run.startedAt;
  return Number.isFinite(duration) && duration >= 0 ? duration : null;
};

/**
 * Folds last-N metric_score_results rows + run metadata into KPI, overall series, and
 * per-statistic metric trend groups (chronological run order ascending).
 */
export const parseTrendsData = (result: StructuredQueryResult | null, runs: Run[]): TrendsData => {
  const runsById = new Map(runs.filter((run) => run.id).map((run) => [run.id as string, run]));
  const rows = result?.rows ?? [];

  const runMeta = new Map<
    string,
    { computedAtMs: number; overallScore: number | null; scores: Map<string, Map<string, number>> }
  >();

  const statistics: string[] = [];
  /** First-seen metric names across all statistics — drives stable card/series order. */
  const metricDiscoveryOrder: string[] = [];

  for (const row of rows) {
    const runId = row[RUN_ID_FIELD];
    if (typeof runId !== 'string') {
      continue;
    }

    const computedAtRaw = Number(row[COMPUTED_AT_MS_FIELD]);
    const computedAtMs = Number.isFinite(computedAtRaw) ? computedAtRaw : 0;
    const metricName = row[METRIC_NAME_FIELD];
    const statName = row[METRIC_SCORE_NAME_FIELD];
    const value = Number(row[VALUE_FIELD]);

    let meta = runMeta.get(runId);
    if (!meta) {
      meta = { computedAtMs, overallScore: null, scores: new Map() };
      runMeta.set(runId, meta);
    } else if (computedAtMs > meta.computedAtMs) {
      meta.computedAtMs = computedAtMs;
    }

    if (typeof metricName !== 'string' || typeof statName !== 'string' || !Number.isFinite(value)) {
      continue;
    }

    const rounded = roundScore(value);

    if (statName === OVERALL_METRIC_SCORE_NAME) {
      if (meta.overallScore == null || computedAtMs >= meta.computedAtMs) {
        meta.overallScore = rounded;
      }
      continue;
    }

    if (!statistics.includes(statName)) {
      statistics.push(statName);
    }

    if (!metricDiscoveryOrder.includes(metricName)) {
      metricDiscoveryOrder.push(metricName);
    }

    let byMetric = meta.scores.get(statName);
    if (!byMetric) {
      byMetric = new Map();
      meta.scores.set(statName, byMetric);
    }
    byMetric.set(metricName, rounded);
  }

  // Prefer score-backed runs (last-N by computed_at). When the suite has runs but no
  // metric_score_results yet, seed the window from run metadata so Trends is not empty.
  const runOrder: TrendsRunPoint[] =
    runMeta.size > 0
      ? [...runMeta.entries()]
          .map(([runId, meta]) => {
            const run = runsById.get(runId);
            return {
              runId,
              runName: run?.testRunName || runId,
              computedAtMs: meta.computedAtMs,
              overallScore: meta.overallScore,
              durationMs: runDurationMs(run),
              isFailed: run?.status === RunStatus.FAILED,
              metricNames: run?.metricNames,
            };
          })
          .sort((a, b) => a.computedAtMs - b.computedAtMs)
      : [...runs]
          .filter((run): run is Run & { id: string } => typeof run.id === 'string')
          .sort((a, b) => (a.completedAt ?? a.startedAt ?? 0) - (b.completedAt ?? b.startedAt ?? 0))
          .slice(-TRENDS_RUN_WINDOW)
          .map((run) => ({
            runId: run.id,
            runName: run.testRunName || run.id,
            computedAtMs: run.completedAt ?? run.startedAt ?? 0,
            overallScore: null,
            durationMs: runDurationMs(run),
            isFailed: run.status === RunStatus.FAILED,
            metricNames: run.metricNames,
          }));

  const runCount = runOrder.length;

  const kpis: TrendsKpiData = {
    runCount,
  };

  const groupDiscoveryOrder: string[] = [];
  const seriesDiscoveryOrder = new Map<string, string[]>();
  for (const metricName of metricDiscoveryOrder) {
    const { group, bar } = splitMetricName(metricName);
    if (!groupDiscoveryOrder.includes(group)) {
      groupDiscoveryOrder.push(group);
    }
    let seriesOrder = seriesDiscoveryOrder.get(group);
    if (!seriesOrder) {
      seriesOrder = [];
      seriesDiscoveryOrder.set(group, seriesOrder);
    }
    if (!seriesOrder.includes(bar)) {
      seriesOrder.push(bar);
    }
  }

  const byStatistic: Record<string, MetricTrendGroup[]> = {};
  for (const statistic of statistics) {
    const groupMap = new Map<string, Map<string, (number | null)[]>>();

    for (let runIndex = 0; runIndex < runOrder.length; runIndex++) {
      const point = runOrder[runIndex];
      const meta = runMeta.get(point.runId);
      const scores = meta?.scores.get(statistic);

      if (scores) {
        for (const metricName of scores.keys()) {
          const { group, bar } = splitMetricName(metricName);
          if (!groupMap.has(group)) {
            groupMap.set(group, new Map());
          }
          const seriesMap = groupMap.get(group)!;
          if (!seriesMap.has(bar)) {
            seriesMap.set(bar, Array(runOrder.length).fill(null));
          }
        }
      }
    }

    for (let runIndex = 0; runIndex < runOrder.length; runIndex++) {
      const point = runOrder[runIndex];
      const meta = runMeta.get(point.runId);
      const scores = meta?.scores.get(statistic);
      if (!scores) {
        continue;
      }
      for (const [metricName, value] of scores) {
        const { group, bar } = splitMetricName(metricName);
        const seriesMap = groupMap.get(group);
        const values = seriesMap?.get(bar);
        if (values) {
          values[runIndex] = value;
        }
      }
    }

    byStatistic[statistic] = groupDiscoveryOrder
      .filter((groupName) => groupMap.has(groupName))
      .map((groupName) => {
        const seriesMap = groupMap.get(groupName)!;
        const seriesNames = (seriesDiscoveryOrder.get(groupName) ?? [...seriesMap.keys()]).filter((name) =>
          seriesMap.has(name),
        );
        return {
          name: groupName,
          series: seriesNames.map((seriesName) => ({
            name: seriesName,
            color: '',
            values: seriesMap.get(seriesName) ?? Array(runOrder.length).fill(null),
          })),
        };
      });
  }

  return { runOrder, kpis, statistics: sortMetricStatistics(statistics), byStatistic };
};

export const emptyTrendsData = (): TrendsData => ({
  runOrder: [],
  kpis: {
    runCount: 0,
  },
  statistics: [],
  byStatistic: {},
});
