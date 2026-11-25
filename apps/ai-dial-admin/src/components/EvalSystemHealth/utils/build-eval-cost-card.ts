import { CoverageSource, CoverageStatus, EvalCostCardModel } from '@/src/components/EvalSystemHealth/models';
import { formatMonthCostDelta } from '@/src/components/EvalTrendsTab/deployment-month-cost';
import { EvalPeriodCosts } from '@/src/models/evaluation/run';

const EMPTY_CARD: Omit<EvalCostCardModel, 'status'> = {
  total: null,
  evaluateesCost: null,
  judgesCost: null,
  deltaLabel: null,
};

/**
 * The Eval cost card. A source that is ready but lacks either period is an error: a total shown without its
 * comparison, or a failed period read as `$0`, would state something the data does not.
 */
export const buildEvalCostCard = (source: CoverageSource<EvalPeriodCosts>): EvalCostCardModel => {
  if (source.status !== CoverageStatus.Ready) {
    return { ...EMPTY_CARD, status: source.status };
  }
  const { current, previous } = source.value ?? { current: null, previous: null };
  if (current == null || previous == null) {
    return { ...EMPTY_CARD, status: CoverageStatus.Error };
  }
  const total = current.totalCost ?? null;
  return {
    status: CoverageStatus.Ready,
    total,
    evaluateesCost: current.testCaseCost ?? null,
    judgesCost: current.metricEvalCost ?? null,
    deltaLabel: formatMonthCostDelta(total, previous.totalCost ?? null),
  };
};
