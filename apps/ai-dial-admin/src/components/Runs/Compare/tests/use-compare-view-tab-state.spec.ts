import { act, renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import {
  createDefaultCompareViewTabState,
  useCompareViewTabState,
} from '@/src/components/Runs/Compare/use-compare-view-tab-state';

describe('Compare :: useCompareViewTabState', () => {
  test('starts with default state', () => {
    const { result } = renderHook(() => useCompareViewTabState('run-1', 'run-2'));

    expect(result.current.state).toEqual(createDefaultCompareViewTabState());
  });

  test('merges partial execution results state', () => {
    const { result } = renderHook(() => useCompareViewTabState('run-1', 'run-2'));

    act(() => {
      result.current.setExecutionResultsState({ hideHighlights: true, viewDifferencesOnly: true });
    });

    expect(result.current.state.executionResults.hideHighlights).toBe(true);
    expect(result.current.state.executionResults.viewDifferencesOnly).toBe(true);
    expect(result.current.state.executionResults.filterModel).toBeNull();
  });

  test('merges partial heat map state', () => {
    const { result } = renderHook(() => useCompareViewTabState('run-1', 'run-2'));

    act(() => {
      result.current.setHeatMapState({
        expandedGroups: new Set(['Accuracy']),
        areExpandedGroupsInitialized: true,
      });
    });

    expect(result.current.state.heatMap.expandedGroups).toEqual(new Set(['Accuracy']));
    expect(result.current.state.heatMap.areExpandedGroupsInitialized).toBe(true);
  });

  test('resets all state when run pair changes', () => {
    const { result, rerender } = renderHook(
      ({ primaryRunId, comparedRunId }) => useCompareViewTabState(primaryRunId, comparedRunId),
      { initialProps: { primaryRunId: 'run-1', comparedRunId: 'run-2' } },
    );

    act(() => {
      result.current.setExecutionResultsState({ hideHighlights: true });
      result.current.setHeatMapState({ areExpandedGroupsInitialized: true });
    });

    rerender({ primaryRunId: 'run-1', comparedRunId: 'run-3' });

    expect(result.current.state).toEqual(createDefaultCompareViewTabState());
  });
});
