import { CompareRun, CompareRunIndex } from '@/src/components/Runs/Compare/models';
import { ExecutionResultColumnLabels } from '@/src/components/Runs/ExecutionResults/models';

export interface CompareDiffCounts {
  improved: number;
  changed: number;
  regressed: number;
}

export interface CompareColumnsCompareOptions {
  hideHighlights?: boolean;
  metricsSchema?: Record<string, Record<string, unknown>>;
  runs?: CompareRun[];
  isGrouped?: boolean;
  showTestCaseSummary?: boolean;
  primaryThreshold?: number | null;
  comparedThreshold?: number | null;
  groupingLabels?: ExecutionResultColumnLabels;
  onToggleGroup?: (groupKey: string) => void;
}

export interface CompareRowDiffVisibility {
  hiddenColIds: ReadonlySet<string>;
}

export interface CompareColumnPanelContext {
  /** Drag id for a panel row whose label repeats, e.g. a metric group split around another block. */
  panelKey?: string;
  panelName?: string;
  panelRunIndex?: CompareRunIndex;
  /** Keeps the synthetic overall-score run/run/delta group out of metric-schema expansion. */
  isOverallScoreGroup?: boolean;
}
