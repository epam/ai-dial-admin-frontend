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
  /** Only takes effect while the run's results vary by run, request or turn. */
  isGroupedByTestCase: boolean;
  /** Kept apart from the flag so a collapsed group stays collapsed when grouping is switched off and on. */
  collapsedGroupKeys: string[];
  showTreePanel: boolean;
  colDefs: ColDef[];
  panelColDefs: ColDef[];
  columnWidths: ColumnWidths;
  results: AnalyticsResult[] | null;
  /** `null` until loaded; empty when the scores could not be loaded. */
  testCaseScores: TestCaseScoreSummary[] | null;
}

export interface GroupedColumnsOptions {
  onToggleGroup: (groupKey: string) => void;
  /**
   * Toggling rebuilds the grid rows, which remounts the group's toggle button; the button that mounts
   * for the toggled group asks here and takes focus, so a keyboard user can keep toggling. A function,
   * not a ref: the grid deep-merges plain objects in `cellRendererParams`, so a `{ current }` object
   * reaches the renderer as a copy that never sees the request.
   */
  consumeFocusRequest?: (groupKey: string) => boolean;
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
