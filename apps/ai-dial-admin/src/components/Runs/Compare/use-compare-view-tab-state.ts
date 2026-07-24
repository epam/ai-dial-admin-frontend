'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  CompareViewTabUiState,
  ExecutionResultsTabUiState,
  HeatMapTabUiState,
  SummaryOverviewTabUiState,
} from '@/src/components/Runs/Compare/models';

const createDefaultExecutionResultsState = (): ExecutionResultsTabUiState => ({
  viewDifferencesOnly: false,
  hideHighlights: false,
  gridColDefs: [],
  panelColDefs: [],
  filterModel: null,
  columnState: null,
  results: null,
  comparedResults: null,
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

  useEffect(() => {
    setState(createDefaultTabState());
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
