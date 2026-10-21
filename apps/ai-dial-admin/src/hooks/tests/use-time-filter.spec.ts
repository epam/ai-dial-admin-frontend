import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import {
  AnchoredTimePeriodOption,
  TimeFilterOption,
  timePeriodOptionsConfig,
} from '@/src/constants/global-time-filter';

import { useTimeFilter } from '../use-time-filter';

const anchor = new Date('2026-01-01T00:00:00.000Z');
const anchoredOption: AnchoredTimePeriodOption = {
  value: 'since-creation',
  label: 'Since Creation',
  startDate: anchor,
};
const options: TimeFilterOption[] = [...timePeriodOptionsConfig, anchoredOption];

describe('useTimeFilter', () => {
  test('initialises from an anchored default period id, resolving its startDate against the anchor', () => {
    const now = new Date('2026-01-05T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const { result } = renderHook(() =>
      useTimeFilter({ defaultTimeFilter: 'since-creation', timePeriodOptions: options }),
    );

    expect(result.current.timePeriod).toBe('since-creation');
    expect(result.current.isCustom).toBe(false);
    expect(result.current.timeRange.startDate.getTime()).toBe(anchor.getTime());
    expect(result.current.timeRange.endDate.getTime()).toBe(now.getTime());

    vi.useRealTimers();
  });

  test('onTimePeriodChange resolves an anchored id against the supplied option list', () => {
    const now = new Date('2026-01-05T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const { result } = renderHook(() => useTimeFilter({ timePeriodOptions: options }));

    act(() => {
      result.current.onTimePeriodChange('since-creation');
    });

    expect(result.current.timePeriod).toBe('since-creation');
    expect(result.current.isCustom).toBe(false);
    expect(result.current.timeRange.startDate.getTime()).toBe(anchor.getTime());
    expect(result.current.timeRange.endDate.getTime()).toBe(now.getTime());

    vi.useRealTimers();
  });
});
