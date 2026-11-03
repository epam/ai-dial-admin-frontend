import { ColDef } from 'ag-grid-community';

import { ColumnWidths } from '@/src/components/Grid/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';
import { ApplicationRoute } from '@/src/types/routes';

export interface SummaryTabUiState {
  selectedStatistic: string | null;
  selectedDistributionMetricName: string | null;
}

export interface ExtractionResultTabUiState {
  showTreePanel: boolean;
  colDefs: ColDef[];
  panelColDefs: ColDef[];
  columnWidths: ColumnWidths;
  results: AnalyticsResult[] | null;
}

export interface RunViewTabUiState {
  summary: SummaryTabUiState;
  extractionResult: ExtractionResultTabUiState;
}

export interface RunDeployment {
  name: string;
  route: ApplicationRoute;
  entity: { name: string; path?: string };
}

export interface CompareAnalyticsRow extends AnalyticsResult {
  _compared?: AnalyticsResult | null;
}
