import { ColDef } from 'ag-grid-community';

import { ColumnWidths } from '@/src/components/Grid/models';
import { TestCaseScoreSummary } from '@/src/components/Runs/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';
import { ApplicationRoute } from '@/src/types/routes';

export interface SummaryTabUiState {
  selectedStatistic: string | null;
  selectedDistributionMetricName: string | null;
}

export interface AnalyticsColumnsOptions {
  /** The run's snapshotted score threshold; omitted until the run is known. */
  threshold?: number | null;
}

export interface ExtractionResultTabUiState {
  showTreePanel: boolean;
  colDefs: ColDef[];
  panelColDefs: ColDef[];
  columnWidths: ColumnWidths;
  results: AnalyticsResult[] | null;
  /** `null` until loaded; empty when the scores could not be loaded. */
  testCaseScores: TestCaseScoreSummary[] | null;
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
