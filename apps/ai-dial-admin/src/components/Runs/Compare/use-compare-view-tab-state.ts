'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  CompareViewTabUiState,
  ExecutionResultsTabUiState,
  HeatMapTabUiState,
  SummaryOverviewTabUiState,
} from '@/src/components/Runs/Compare/models';

const createDefaultExecutionResultsState = (): ExecutionResultsTabUiState => ({
  isGroupedByTestCase: true,
  viewDifferencesOnly: false,
  hideHighlights: false,
  panelColDefs: [],
  filterModel: null,
  columnState: null,
  columnWidths: {},
  results: null,
  comparedResults: null,
  testCaseScores: null,
  primaryThreshold: null,
  comparedThreshold: null,
});

const createDefaultHeatMapState = (): HeatMapTabUiState => ({
  expandedGroups: new Set(),
  areExpandedGroupsInitialized: false,
  results: null,
  comparedResults: null,
});

const createDefaultSummaryState = (): SummaryOverviewTabUiState => ({
  selectedStatistic: null,
  selectedDistributionMetricName: null,
});

const createDefaultTabState = (): CompareViewTabUiState => ({
  executionResults: createDefaultExecutionResultsState(),
  heatMap: createDefaultHeatMapState(),
  summary: createDefaultSummaryState(),
});

export const createDefaultCompareViewTabState = createDefaultTabState;

export interface UseCompareViewTabStateReturn {
  state: CompareViewTabUiState;
  setExecutionResultsState: (patch: Partial<ExecutionResultsTabUiState>) => void;
  setHeatMapState: (patch: Partial<HeatMapTabUiState>) => void;
  setSummaryState: (patch: Partial<SummaryOverviewTabUiState>) => void;
}

export const useCompareViewTabState = (primaryRunId: string, comparedRunId: string): UseCompareViewTabStateReturn => {
  const [state, setState] = useState<CompareViewTabUiState>(createDefaultTabState);

  // Column ids follow the run slot, not the run, so a flip or a swapped run keeps the widths the operator set.
  useEffect(() => {
    setState((prev) => {
      const next = createDefaultTabState();
      next.executionResults.columnWidths = prev.executionResults.columnWidths;
      return next;
    });
  }, [primaryRunId, comparedRunId]);

  const setExecutionResultsState = useCallback((patch: Partial<ExecutionResultsTabUiState>) => {
    setState((prev) => ({
      ...prev,
      executionResults: { ...prev.executionResults, ...patch },
    }));
  }, []);

  const setHeatMapState = useCallback((patch: Partial<HeatMapTabUiState>) => {
    setState((prev) => ({
      ...prev,
      heatMap: { ...prev.heatMap, ...patch },
    }));
  }, []);

  const setSummaryState = useCallback((patch: Partial<SummaryOverviewTabUiState>) => {
    setState((prev) => ({
      ...prev,
      summary: { ...prev.summary, ...patch },
    }));
  }, []);

  return {
    state,
    setExecutionResultsState,
    setHeatMapState,
    setSummaryState,
  };
};
