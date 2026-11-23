import { ACTIVITY_KIND_ORDER } from '@/src/components/EvalSystemHealth/constants';
import {
  ActivityCardModel,
  ActivityKind,
  ActivityResults,
  CoverageSource,
  CoverageStatus,
} from '@/src/components/EvalSystemHealth/models';
import {
  countRows,
  countTargetedEvaluatees,
  readTotalCount,
} from '@/src/components/EvalSystemHealth/utils/parse-activity-results';

const EMPTY_CARD: Omit<ActivityCardModel, 'kind' | 'status'> = {
  value: 0,
  delta: null,
  total: null,
  rate: null,
  evaluateeCount: null,
};

const suitesRunCard = ({ totalSuites, suitesRunCurrent, suitesRunPrevious }: ActivityResults): ActivityCardModel => {
  if (totalSuites == null || suitesRunCurrent == null || suitesRunPrevious == null) {
    return { ...EMPTY_CARD, kind: ActivityKind.SuitesRun, status: CoverageStatus.Error };
  }
  const value = countRows(suitesRunCurrent);
  const total = readTotalCount(totalSuites);
  return {
    kind: ActivityKind.SuitesRun,
    status: CoverageStatus.Ready,
    value,
    delta: value - countRows(suitesRunPrevious),
    total,
    rate: total > 0 ? value / total : null,
    evaluateeCount: null,
  };
};

const suitesAddedCard = ({ suitesAddedCurrent, suitesAddedPrevious }: ActivityResults): ActivityCardModel => {
  if (suitesAddedCurrent == null || suitesAddedPrevious == null) {
    return { ...EMPTY_CARD, kind: ActivityKind.SuitesAdded, status: CoverageStatus.Error };
  }
  const value = readTotalCount(suitesAddedCurrent);
  return {
    kind: ActivityKind.SuitesAdded,
    status: CoverageStatus.Ready,
    value,
    delta: value - readTotalCount(suitesAddedPrevious),
    total: null,
    rate: null,
    evaluateeCount: countTargetedEvaluatees(suitesAddedCurrent),
  };
};

const cardOf = (kind: ActivityKind, results: ActivityResults): ActivityCardModel =>
  kind === ActivityKind.SuitesRun ? suitesRunCard(results) : suitesAddedCard(results);

/**
 * The two activity cards, in display order. While the batch is pending or when the whole call failed both
 * cards share that state; once it has returned, each card is in error only if a query it reads came back `null`.
 */
export const buildActivityCards = (source: CoverageSource<ActivityResults>): ActivityCardModel[] =>
  ACTIVITY_KIND_ORDER.map((kind) =>
    source.status === CoverageStatus.Ready && source.value != null
      ? cardOf(kind, source.value)
      : { ...EMPTY_CARD, kind, status: source.status },
  );
