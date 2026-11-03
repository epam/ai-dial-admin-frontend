'use client';

import { useMemo } from 'react';

import { isIncompleteRunStatus, isTransitionalRunStatus } from '@/src/components/Common/RunStatus/utils';
import { useDeploymentType } from '@/src/components/Runs/Summary/use-deployment-type';
import { useModelPricing } from '@/src/components/Runs/Summary/use-model-pricing';
import { useRunCosts } from '@/src/components/Runs/Summary/use-run-costs';
import { hasRunCostFigure, sumRunCostParts } from '@/src/components/Runs/Summary/utils';
import { isCostUnsupportedRun, isRunCostStale } from '@/src/components/Runs/utils/run-list-values';
import { Run } from '@/src/models/evaluation/run';

interface Params {
  run: Run | null | undefined;
  /**
   * The run has no eval_summaries runtime figures — used for the Error presentation only. Must NOT
   * gate the cost fetch: CANCELLED/FAILED runs often have cost figures with no eval_summaries row, and
   * flipping `canHaveCosts` false after an optimistic fetch would wipe them.
   */
  hasNoResults: boolean;
  /** How many metrics the run computed; omitted while the snapshots are still loading. */
  metricSnapshotCount?: number;
}

export interface RunCostState {
  totalCost: number | null;
  sourceCost: number | null;
  metricsCost: number | null;
  /** The whole card is waiting on the totals endpoint. */
  isPending: boolean;
  /** The Metrics value is waiting; false as soon as the run is known to have no metrics. */
  isMetricsPending: boolean;
  hasError: boolean;
}

/**
 * A run's Total Run Cost card state: fetch eligibility (which runs can never have a cost, see the
 * `run-summary-cost-cards` spec), the polled totals, and the pending / Error derivation shared by the
 * Run Summary strip and each side of the Run Comparison strip.
 */
export const useRunCostState = ({ run, hasNoResults, metricSnapshotCount }: Params): RunCostState => {
  const isRunInProgress = isTransitionalRunStatus(run?.status);
  // Cost aggregation doesn't support MCP-tool or Route suites at all yet — confirmed by QA reproduction
  // (the card stays in Calculating indefinitely regardless of whether the run computed metrics).
  // Skip the fetch unconditionally rather than polling toward a result the backend can never produce.
  const isCostUnsupported = isCostUnsupportedRun(run);
  // A model with no Prompt/Completion rate configured can never produce a cost figure either — the
  // backend has nothing to multiply usage by. Resolved from the deployed model's own config, not from
  // the costs endpoint, so such a run shows a dash immediately instead of polling toward a result that
  // will never arrive. Applications have no pricing of their own at the Admin level (see
  // `resolveModelPricing`), so this only ever fires for a model deployment.
  const { deploymentType } = useDeploymentType(run?.suiteSnapshot?.deploymentRef);
  const { isDefinitelyUnpriced } = useModelPricing(run?.suiteSnapshot?.deploymentRef?.id, deploymentType);
  // Evaluated once per run so a render landing on the 12h boundary can't flip it and restart the fetch.
  const shouldPollCosts = useMemo(() => !isRunCostStale(run, Date.now()), [run]);
  const canHaveCosts = !isRunInProgress && !isCostUnsupported && !isDefinitelyUnpriced;
  const { costs, isPending, unavailable } = useRunCosts(run?.id, canHaveCosts, shouldPollCosts);

  // Incomplete statuses (incl. CANCELLED/FAILED) never Error the card — missing figures are a dash.
  // COMPLETED still Errors on endpoint failure or on no eval_summaries with no cost figures.
  const isRunIncomplete = isIncompleteRunStatus(run?.status);
  const hasError = !isRunIncomplete && (unavailable || (hasNoResults && !hasRunCostFigure(costs)));

  // A run that computed zero metrics can never have a metrics cost, which the metric snapshots already
  // fetched for the rest of the Summary tab say. Its Metrics value settles immediately instead of
  // sharing the card's Calculating wait for a field that will always come back null.
  const hasNoMetrics = metricSnapshotCount === 0;

  return {
    totalCost: sumRunCostParts(costs),
    sourceCost: costs?.sourceCost ?? null,
    metricsCost: costs?.metricsCost ?? null,
    isPending,
    isMetricsPending: isPending && !hasNoMetrics,
    hasError,
  };
};
