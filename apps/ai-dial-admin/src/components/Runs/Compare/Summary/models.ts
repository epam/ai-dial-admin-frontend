import { ComponentProps, ReactNode } from 'react';

import { AnalyticsCard } from '@epam/ai-dial-ui-kit';

import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { MetricDelta } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { RunKpiFigures } from '@/src/components/Runs/Summary/models';
import { RunCostState } from '@/src/components/Runs/Summary/use-run-cost-state';
import { RunsI18nKey } from '@/src/constants/i18n';
import { OverallScoreConfig } from '@/src/models/evaluation/test-suite';

/** Dual-run statistic card for the Distribution section. */
export interface CompareMetricStatCard {
  name: string;
  primaryValue: number | null;
  comparedValue: number | null;
}

/** One metric group aligned for AnalyticsBarGroup compare mode. */
export interface CompareBarGroup {
  name: string;
  data: Record<string, number | null>;
  compareData: Record<string, number | null>;
  description?: string;
  barDescriptions?: Record<string, string>;
}

/** One run's line in a DualRunField; the list is already in display order. */
export interface DualRunFieldEntry {
  key: string;
  runName: string;
  value: string;
  postfix?: ReactNode;
}

/** The two-slot `compareValues` shape AnalyticsCard takes. */
export type CompareCardItems = NonNullable<ComponentProps<typeof AnalyticsCard>['compareValues']>;

/** Everything the Compare Summary KPI cards render, derived once from both runs. */
export interface CompareKpiCards {
  figures: Record<CompareRunSlot, RunKpiFigures>;
  sourceLabels: Record<CompareRunSlot, string>;
  costs: Record<CompareRunSlot, RunCostState>;
  /** Each run's own overall-score method; null where the run records none. */
  scoreMethods: Record<CompareRunSlot, OverallScoreConfig | null>;
  /** Pass rate per run; null for a run that cannot be rated against the other (mixed thresholds). */
  rates: Record<CompareRunSlot, number | null>;
  rateTitleKey: RunsI18nKey;
  /** Second run minus baseline; `rate` is null when the thresholds are mixed, `costLabel` while a cost is unsettled. */
  deltas: {
    completed: MetricDelta;
    rate: MetricDelta | null;
    overallScore: MetricDelta;
    runtime: MetricDelta;
    costLabel: string | null;
  };
  hasNoTestCases: boolean;
  hasRuntimeError: Record<CompareRunSlot, boolean>;
  hasBothRuntimeErrors: boolean;
  hasBothCostErrors: boolean;
  hasOverallScore: boolean;
}
