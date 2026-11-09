import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
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
  /** Each run's snapshotted score threshold, by slot; a missing entry reads as no threshold. */
  thresholds?: Partial<Record<CompareRunSlot, number | null>>;
}

export interface CompareRowDiffVisibility {
  hiddenColIds: ReadonlySet<string>;
}

export interface CompareColumnPanelContext {
  /** Drag id for a panel row whose label repeats, e.g. a metric group split around another block. */
  panelKey?: string;
  panelName?: string;
  panelRunIndex?: CompareRunIndex;
}
