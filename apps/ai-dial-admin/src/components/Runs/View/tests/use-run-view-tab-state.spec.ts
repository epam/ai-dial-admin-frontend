import { renderHook, act } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { createDefaultRunViewTabState, useRunViewTabState } from '../use-run-view-tab-state';

describe('Runs View :: useRunViewTabState', () => {
  test('starts with default state', () => {
    const { result } = renderHook(() => useRunViewTabState('run-1'));

    expect(result.current.state).toEqual(createDefaultRunViewTabState());
  });

  test('merges partial summary state', () => {
    const { result } = renderHook(() => useRunViewTabState('run-1'));

    act(() => {
      result.current.setSummaryState({ selectedStatistic: 'MIN' });
    });

    expect(result.current.state.summary.selectedStatistic).toBe('MIN');
    expect(result.current.state.summary.selectedDistributionMetricName).toBeNull();
  });

  test('merges partial extraction result state', () => {
    const { result } = renderHook(() => useRunViewTabState('run-1'));

    act(() => {
      result.current.setExtractionResultState({ results: [] });
    });

    expect(result.current.state.extractionResult.results).toEqual([]);
  });

  test('resetSummarySelections clears metric selections but keeps statistic', () => {
    const { result } = renderHook(() => useRunViewTabState('run-1'));

    act(() => {
      result.current.setSummaryState({
        selectedStatistic: 'MIN',
        selectedDistributionMetricName: 'metric.b',
      });
    });

    act(() => {
      result.current.resetSummarySelections();
    });

    expect(result.current.state.summary).toEqual({
      selectedStatistic: 'MIN',
      selectedDistributionMetricName: null,
    });
  });

  test('resets all state when runId changes', () => {
    const { result, rerender } = renderHook(({ runId }) => useRunViewTabState(runId), {
      initialProps: { runId: 'run-1' },
    });

    act(() => {
      result.current.setSummaryState({ selectedStatistic: 'P90' });
      result.current.setExtractionResultState({ results: [] });
    });

    rerender({ runId: 'run-2' });

    expect(result.current.state).toEqual(createDefaultRunViewTabState());
  });
});
