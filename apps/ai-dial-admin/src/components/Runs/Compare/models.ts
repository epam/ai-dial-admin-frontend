import { ColDef, ColumnState, FilterModel } from 'ag-grid-community';

import {
  CompareRunSlot,
  RUN_COMPARE_PRIMARY_INDEX,
  RUN_COMPARE_SECONDARY_INDEX,
} from '@/src/components/Runs/Compare/constants';
import { AnalyticsResult } from '@/src/models/evaluation/run';

export type CompareRunIndex = typeof RUN_COMPARE_PRIMARY_INDEX | typeof RUN_COMPARE_SECONDARY_INDEX;

/**
 * One compared run, as the views see it. Views receive these already in display order and render by
 * iterating, so reordering the list is all a flip does. The slot is the run's identity (which data
 * it owns); the baseline is the run deltas are measured against, wherever it is displayed.
 */
export interface CompareRun {
  slot: CompareRunSlot;
  index: CompareRunIndex;
  id: string;
  name: string;
  isBaseline: boolean;
}

export interface CompareRunSource {
  id: string;
  name: string;
}

export interface ExecutionResultsTabUiState {
  viewDifferencesOnly: boolean;
  hideHighlights: boolean;
  gridColDefs: ColDef[];
  panelColDefs: ColDef[];
  filterModel: FilterModel | null;
  columnState: ColumnState[] | null;
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
