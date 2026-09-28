import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getSessions } from '@/src/app/[lang]/sessions/actions';
import { useSessions } from '@/src/components/Analytics/SessionsTrace/use-sessions';
import { SESSIONS_TIME_PERIOD } from '@/src/constants/analytics/sessions-trace';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { SessionPeriodSummary } from '@/src/models/analytics/sessions-trace';

vi.mock('@/src/app/[lang]/sessions/actions', () => ({
  getSessions: vi.fn(),
}));

const getSessionsMock = getSessions as unknown as ReturnType<typeof vi.fn>;

const PERIOD: SessionPeriodSummary = {
  totals: { sessions: 212, cost: '654.07' },
  ratings: { rated: 19, negative: 13 },
};

const CUSTOM_RANGE = {
  startDate: new Date('2026-03-01T00:00:00.000Z'),
  endDate: new Date('2026-03-03T00:00:00.000Z'),
};

const preset = (value: string) => timePeriodOptionsConfig.find((option) => option.value === value);

const rowsParams = () =>
  ({
    startRow: 0,
    endRow: 100,
    successCallback: vi.fn(),
    failCallback: vi.fn(),
    sortModel: [],
    filterModel: {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

beforeEach(() => {
  getSessionsMock.mockReset();
  getSessionsMock.mockResolvedValue({ success: true, response: { rows: [], total: 0, period: PERIOD } });
});

describe('useSessions :: the period caption', () => {
  test('names the default preset the way the time-filter control names it', () => {
    const { result } = renderHook(() => useSessions());

    expect(result.current.periodLabel).toBe(preset(SESSIONS_TIME_PERIOD)?.label);
  });

  test('names another preset once it is selected', () => {
    const { result } = renderHook(() => useSessions());

    act(() => result.current.onTimePeriodChange('30d'));

    expect(result.current.periodLabel).toBe(preset('30d')?.label);
  });

  // The preset id is not cleared when a custom range is applied, so a caption read from it alone would
  // label a custom range with whichever preset was chosen before it.
  test('names the range itself once a custom range is applied, not the stale preset', () => {
    const { result } = renderHook(() => useSessions());

    act(() => result.current.onTimeRangeChange(CUSTOM_RANGE, true));

    expect(result.current.periodLabel).not.toBe(preset(SESSIONS_TIME_PERIOD)?.label);
    expect(result.current.periodLabel).toContain('-');
  });
});

describe('useSessions :: the period figures', () => {
  const loadFirstPage = async (result: { current: ReturnType<typeof useSessions> }) => {
    await act(async () => {
      await result.current.datasource.getRows(rowsParams());
    });
  };

  test('holds the figures the first page resolved', async () => {
    const { result } = renderHook(() => useSessions());

    await loadFirstPage(result);

    await waitFor(() => expect(result.current.period).toEqual(PERIOD));
  });

  // The caption repaints the instant the period changes while the figures only arrive when the refetch
  // resolves, so holding the old ones would put a 30d caption over 7d numbers.
  test('clears the figures when the period changes, so no caption labels stale numbers', async () => {
    const { result } = renderHook(() => useSessions());

    await loadFirstPage(result);
    await waitFor(() => expect(result.current.period).toEqual(PERIOD));

    act(() => result.current.onTimePeriodChange('30d'));

    await waitFor(() => expect(result.current.period).toBeNull());
    expect(result.current.periodLabel).toBe(preset('30d')?.label);
  });

  // Nothing cancels a request whose filter state has moved on. Without a guard the slow response lands
  // after the period changed and puts the previous period's figures under the new caption.
  test('ignores a response that lands after the period has moved on', async () => {
    let releaseFirst: (value: unknown) => void = () => undefined;
    getSessionsMock.mockReturnValueOnce(new Promise((resolve) => (releaseFirst = resolve)));

    const { result } = renderHook(() => useSessions());

    let inFlight: Promise<void> = Promise.resolve();
    act(() => {
      inFlight = result.current.datasource.getRows(rowsParams()) as unknown as Promise<void>;
    });

    act(() => result.current.onTimePeriodChange('30d'));

    await act(async () => {
      releaseFirst({ success: true, response: { rows: [], total: 0, period: PERIOD } });
      await inFlight;
    });

    expect(result.current.period).toBeNull();
    expect(result.current.periodLabel).toBe(preset('30d')?.label);
  });

  test('keeps the figures standing when only the search term changes', async () => {
    const { result } = renderHook(() => useSessions());

    await loadFirstPage(result);
    await waitFor(() => expect(result.current.period).toEqual(PERIOD));

    act(() => result.current.onSearchChange('acme'));

    expect(result.current.period).toEqual(PERIOD);
  });
});
