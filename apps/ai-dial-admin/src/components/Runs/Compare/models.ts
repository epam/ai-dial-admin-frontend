import { ColDef, ColumnState, FilterModel } from 'ag-grid-community';

import { AnalyticsResult } from '@/src/models/evaluation/run';

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

export interface CompareViewTabUiState {
  executionResults: ExecutionResultsTabUiState;
  heatMap: HeatMapTabUiState;
}
