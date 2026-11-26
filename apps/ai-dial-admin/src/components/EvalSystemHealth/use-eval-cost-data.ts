'use client';

import { useEffect, useMemo, useState } from 'react';

import { getEvalPeriodCosts } from '@/src/app/[lang]/runs/actions';
import { CoverageSource, CoverageStatus, EvalCostCardModel } from '@/src/components/EvalSystemHealth/models';
import { buildEvalCostCard } from '@/src/components/EvalSystemHealth/utils/build-eval-cost-card';
import { MonthCostWindows } from '@/src/components/EvalTrendsTab/deployment-month-cost';
import { EvalPeriodCosts } from '@/src/models/evaluation/run';

const LOADING: CoverageSource<EvalPeriodCosts> = { status: CoverageStatus.Loading };
const FAILED: CoverageSource<EvalPeriodCosts> = { status: CoverageStatus.Error };

/** Never rejects: a request that cannot be read at all is reported as failed. */
const loadCosts = async ({ current, previous }: MonthCostWindows): Promise<CoverageSource<EvalPeriodCosts>> => {
  try {
    const value = await getEvalPeriodCosts(current.fromMs, current.toMs, previous.fromMs, previous.toMs);
    return { status: CoverageStatus.Ready, value };
  } catch {
    return FAILED;
  }
};

/**
 * Loads the platform-wide evaluation cost of both periods and returns the Eval cost card. The periods come from
 * the caller, so the card covers exactly what the count cards cover and follows the same midnight rollover; the
 * cost is loaded again whenever they change.
 */
export const useEvalCostData = (windows: MonthCostWindows): EvalCostCardModel => {
  const [source, setSource] = useState<CoverageSource<EvalPeriodCosts>>(LOADING);

  useEffect(() => {
    let isCancelled = false;

    setSource(LOADING);
    const load = async () => {
      const loaded = await loadCosts(windows);
      if (!isCancelled) {
        setSource(loaded);
      }
    };
    void load();

    return () => {
      isCancelled = true;
    };
  }, [windows]);

  return useMemo(() => buildEvalCostCard(source), [source]);
};
