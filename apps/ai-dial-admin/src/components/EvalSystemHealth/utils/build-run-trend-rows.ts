import {
  RUN_TREND_KIND_BY_DEPLOYMENT_TYPE,
  RUN_TREND_KIND_BY_SUITE_TYPE,
} from '@/src/components/EvalSystemHealth/constants';
import { RunTrendRow } from '@/src/components/EvalSystemHealth/models';
import { formatPassRateDelta } from '@/src/components/TestSuites/Trends/Kpi/utils/pass-rate';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { SuiteRunTrend } from '@/src/models/evaluation/run-trend';

const resolveKindKey = ({ evaluatee, suiteType }: SuiteRunTrend): EvalSystemHealthI18nKey =>
  RUN_TREND_KIND_BY_DEPLOYMENT_TYPE[evaluatee.type as DeploymentType] ?? RUN_TREND_KIND_BY_SUITE_TYPE[suiteType];

const buildRunTrendRow = (suite: SuiteRunTrend): RunTrendRow => {
  const { evaluatee, runs, latestPassRate, previousPassRate } = suite;
  const evaluateeName = evaluatee.name || evaluatee.id || null;

  return {
    suiteId: suite.suiteId,
    suiteName: suite.suiteName,
    evaluateeName,
    kindKey: evaluateeName == null ? null : resolveKindKey(suite),
    points: runs.map((run) => run.passRate).filter((rate): rate is number => rate != null),
    latestRate: latestPassRate ?? null,
    deltaLabel: formatPassRateDelta(latestPassRate ?? null, previousPassRate ?? null),
  };
};

/** Maps the suites of a run-trends page to table rows, keeping the backend's order. */
export const buildRunTrendRows = (suites: SuiteRunTrend[]): RunTrendRow[] => suites.map(buildRunTrendRow);
