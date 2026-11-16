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
      result.current.setExtractionResultState({ showTreePanel: true });
    });

    expect(result.current.state.extractionResult.showTreePanel).toBe(true);
  });

  test('starts with grouping off and no group collapsed', () => {
    const { result } = renderHook(() => useRunViewTabState('run-1'));

    expect(result.current.state.extractionResult.isGroupedByTestCase).toBe(false);
    expect(result.current.state.extractionResult.collapsedGroupKeys).toEqual([]);
  });

  test('keeps the collapsed groups when grouping is switched off', () => {
    const { result } = renderHook(() => useRunViewTabState('run-1'));

    act(() => {
      result.current.setExtractionResultState({ isGroupedByTestCase: true, collapsedGroupKeys: ['tc-1'] });
    });
    act(() => {
      result.current.setExtractionResultState({ isGroupedByTestCase: false });
    });

    expect(result.current.state.extractionResult.collapsedGroupKeys).toEqual(['tc-1']);
  });

  test('forgets the grouping choice and the collapsed groups when the run changes', () => {
    const { result, rerender } = renderHook(({ runId }) => useRunViewTabState(runId), {
      initialProps: { runId: 'run-1' },
    });

    act(() => {
      result.current.setExtractionResultState({ isGroupedByTestCase: true, collapsedGroupKeys: ['tc-1'] });
    });

    rerender({ runId: 'run-2' });

    expect(result.current.state.extractionResult.isGroupedByTestCase).toBe(false);
    expect(result.current.state.extractionResult.collapsedGroupKeys).toEqual([]);
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
      result.current.setExtractionResultState({ showTreePanel: true });
    });

    rerender({ runId: 'run-2' });

    expect(result.current.state).toEqual(createDefaultRunViewTabState());
  });
});
