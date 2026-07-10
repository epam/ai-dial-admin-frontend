'use client';

import { useCallback, useEffect, useState } from 'react';

import { getAnalyticsColumns } from '@/src/components/Runs/View/utils';

import { ExtractionResultTabUiState, RunViewTabUiState, SummaryTabUiState } from './models';

const createDefaultSummaryState = (): SummaryTabUiState => ({
  selectedStatistic: null,
  selectedDistributionMetricName: null,
});

const createDefaultExtractionResultState = (): ExtractionResultTabUiState => {
  const defaultColDefs = getAnalyticsColumns([]);
  return {
    showTreePanel: false,
    colDefs: defaultColDefs,
    panelColDefs: defaultColDefs,
    results: null,
    snapshots: [],
  };
};

const createDefaultTabState = (): RunViewTabUiState => ({
  summary: createDefaultSummaryState(),
  extractionResult: createDefaultExtractionResultState(),
});

export const createDefaultRunViewTabState = createDefaultTabState;

export interface UseRunViewTabStateReturn {
  state: RunViewTabUiState;
  setSummaryState: (patch: Partial<SummaryTabUiState>) => void;
  setExtractionResultState: (patch: Partial<ExtractionResultTabUiState>) => void;
  resetSummarySelections: () => void;
}

export const useRunViewTabState = (runId: string | undefined): UseRunViewTabStateReturn => {
  const [state, setState] = useState<RunViewTabUiState>(createDefaultTabState);

  useEffect(() => {
    setState(createDefaultTabState());
  }, [runId]);

  const setSummaryState = useCallback((patch: Partial<SummaryTabUiState>) => {
    setState((prev) => ({
      ...prev,
      summary: { ...prev.summary, ...patch },
    }));
  }, []);

  const setExtractionResultState = useCallback((patch: Partial<ExtractionResultTabUiState>) => {
    setState((prev) => ({
      ...prev,
      extractionResult: { ...prev.extractionResult, ...patch },
    }));
  }, []);

  const resetSummarySelections = useCallback(() => {
    setState((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        selectedDistributionMetricName: null,
      },
    }));
  }, []);

  return {
    state,
    setSummaryState,
    setExtractionResultState,
    resetSummarySelections,
  };
};
