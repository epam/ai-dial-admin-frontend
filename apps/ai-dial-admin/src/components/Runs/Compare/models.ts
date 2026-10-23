import { ColDef, ColumnState, FilterModel } from 'ag-grid-community';

import { ColumnWidths } from '@/src/components/Grid/models';
import {
  CompareRunSlot,
  RUN_COMPARE_PRIMARY_INDEX,
  RUN_COMPARE_SECONDARY_INDEX,
} from '@/src/components/Runs/Compare/constants';
import { AnalyticsResult, Run } from '@/src/models/evaluation/run';

export type CompareRunIndex = typeof RUN_COMPARE_PRIMARY_INDEX | typeof RUN_COMPARE_SECONDARY_INDEX;

/**
 * One compared run, as the views see it. Views receive these in display order and render by iterating.
 * The slot says which data the run owns; the primary slot is the baseline every delta is measured against,
 * and it is always displayed first. Flipping swaps the runs between the slots.
 */
export interface CompareRun {
  slot: CompareRunSlot;
  index: CompareRunIndex;
  id: string;
  name: string;
  isBaseline: boolean;
}

/** A run offered in the compare picker, with the name of the suite it belongs to (suites differ across a dataset). */
export interface CompareCandidateRun extends Run {
  testSuiteName?: string;
}

export interface CompareRunSource {
  id: string;
  name: string;
}

export interface ExecutionResultsTabUiState {
  viewDifferencesOnly: boolean;
  hideHighlights: boolean;
  panelColDefs: ColDef[];
  filterModel: FilterModel | null;
  columnState: ColumnState[] | null;
  columnWidths: ColumnWidths;
  results: AnalyticsResult[] | null;
  comparedResults: AnalyticsResult[] | null;
}

export interface HeatMapTabUiState {
  expandedGroups: Set<string>;
  areExpandedGroupsInitialized: boolean;
  results: AnalyticsResult[] | null;
  comparedResults: AnalyticsResult[] | null;
}

export interface SummaryOverviewTabUiState {
  selectedStatistic: string | null;
  selectedDistributionMetricName: string | null;
}

export interface CompareViewTabUiState {
  executionResults: ExecutionResultsTabUiState;
  heatMap: HeatMapTabUiState;
  summary: SummaryOverviewTabUiState;
}
