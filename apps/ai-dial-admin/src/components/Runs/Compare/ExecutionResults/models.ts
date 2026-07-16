import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';

export interface CompareDiffCounts {
  improved: number;
  changed: number;
  regressed: number;
}

export interface CompareColumnsCompareOptions {
  hideHighlights?: boolean;
  metricsSchema?: Record<string, Record<string, unknown>>;
}

export interface ComparePanelRunNames {
  primary: string;
  secondary: string;
}

export interface CompareRowDiffVisibility {
  hiddenColIds: ReadonlySet<string>;
}

export interface CompareColumnPanelContext {
  panelName?: string;
  panelRunIndex?: typeof RUN_COMPARE_PRIMARY_INDEX | typeof RUN_COMPARE_SECONDARY_INDEX;
}
