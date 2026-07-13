import { ColDef } from 'ag-grid-community';

import { MetricSnapshot } from '@/src/models/evaluation/metric';
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
  results: AnalyticsResult[] | null;
  snapshots: MetricSnapshot[];
}

export interface RunViewTabUiState {
  summary: SummaryTabUiState;
  extractionResult: ExtractionResultTabUiState;
}

export interface RunDeployment {
  name: string;
  route: ApplicationRoute;
}

export interface MetricEntry {
  key: string;
  value: number | null;
  isError: boolean;
}

export interface MetricGroup {
  title: string;
  metrics: MetricEntry[];
  info?: Record<string, unknown>;
  hasError: boolean;
  errorMessage?: string;
}

export interface CompareAnalyticsRow extends AnalyticsResult {
  _compared?: AnalyticsResult | null;
}
