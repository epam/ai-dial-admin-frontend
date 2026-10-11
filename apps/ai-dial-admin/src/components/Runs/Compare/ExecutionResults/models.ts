import { CompareRun, CompareRunIndex } from '@/src/components/Runs/Compare/models';

export interface CompareDiffCounts {
  improved: number;
  changed: number;
  regressed: number;
}

export interface CompareColumnsCompareOptions {
  hideHighlights?: boolean;
  metricsSchema?: Record<string, Record<string, unknown>>;
  runs?: CompareRun[];
}

export interface CompareRowDiffVisibility {
  hiddenColIds: ReadonlySet<string>;
}

export interface CompareColumnPanelContext {
  panelName?: string;
  panelRunIndex?: CompareRunIndex;
}
