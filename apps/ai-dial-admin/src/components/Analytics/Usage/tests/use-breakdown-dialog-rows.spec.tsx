import { IGetRowsParams } from 'ag-grid-community';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { BreakdownTab, UsageView } from '@/src/components/Analytics/Usage/models';
import { useBreakdownDialogRows } from '@/src/components/Analytics/Usage/use-breakdown-dialog-rows';
import { StructuredQuery } from '@/src/models/analytics/query';
import { QueryOutcome } from '@/src/components/Analytics/Common/use-analytics-query';

const runQueryMock = vi.fn(
  async (_query?: unknown): Promise<QueryOutcome> => ({ isSuccess: true, result: { rows: [] } }),
);

// The dialog reads through the shared runner, which owns cancellation; this spec is about what the
// dialog does with an outcome, so the runner is the seam.
const RUNNER = { runQuery: runQueryMock, runSql: vi.fn() };
vi.mock('@/src/components/Analytics/Common/use-analytics-query', () => ({
  useAnalyticsQuery: () => RUNNER,
}));

const WINDOW = {
  startDate: new Date('2026-09-21T00:00:00.000Z'),
  endDate: new Date('2026-09-22T00:00:00.000Z'),
};

const PREVIOUS_WINDOW = {
  startDate: new Date('2026-09-20T00:00:00.000Z'),
  endDate: new Date('2026-09-21T00:00:00.000Z'),
};

const NOTICE = { report: vi.fn(), reset: vi.fn() };

const answer = (rows: Record<string, unknown>[]) => ({ isSuccess: true, result: { rows } });

const deploymentRows = (count: number, from = 0) =>
  Array.from({ length: count }, (_, index) => ({ deployment: `model-${from + index}`, calls: 10 }));

const getRowsParams = (startRow: number, endRow: number) =>
  ({
    startRow,
    endRow,
    sortModel: [],
    filterModel: {},
    successCallback: vi.fn(),
    failCallback: vi.fn(),
    context: {},
  }) as unknown as IGetRowsParams & {
    successCallback: ReturnType<typeof vi.fn>;
    failCallback: ReturnType<typeof vi.fn>;
  };

const renderRows = (overrides: Partial<Parameters<typeof useBreakdownDialogRows>[0]> = {}) =>
  renderHook(() =>
    useBreakdownDialogRows({
      view: UsageView.Llm,
      windows: { current: WINDOW },
      tab: BreakdownTab.Models,
      windowTotal: 100,
      searchTerm: '',
      notice: NOTICE,
      ...overrides,
    }),
  );

const queryOf = (call: number): StructuredQuery => runQueryMock.mock.calls[call][0] as StructuredQuery;

describe('useBreakdownDialogRows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runQueryMock.mockImplementation(async () => answer([]) as never);
  });

  test('reads a block at the offset the grid asks for', async () => {
    runQueryMock.mockResolvedValueOnce(answer(deploymentRows(25)) as never);
    const { result } = renderRows();
    const params = getRowsParams(50, 75);

    await act(async () => {
      await result.current.datasource.getRows(params);
    });

    expect(queryOf(0).page).toMatchObject({ offset: 50, limit: 25 });
    expect(params.successCallback).toHaveBeenCalledOnce();
  });

  test('states the end of the list when a block comes back short', async () => {
    runQueryMock.mockResolvedValueOnce(answer(deploymentRows(9)) as never);
    const { result } = renderRows();
    const params = getRowsParams(0, 25);

    await act(async () => {
      await result.current.datasource.getRows(params);
    });

    expect(params.successCallback).toHaveBeenCalledWith(expect.any(Array), 9);
  });

  test('states no end while a block comes back full', async () => {
    runQueryMock.mockResolvedValueOnce(answer(deploymentRows(25)) as never);
    const { result } = renderRows();
    const params = getRowsParams(0, 25);

    await act(async () => {
      await result.current.datasource.getRows(params);
    });

    expect(params.successCallback).toHaveBeenCalledWith(expect.any(Array), undefined);
  });

  test('narrows the read by the settled search term', async () => {
    const { result } = renderRows({ searchTerm: ' gpt ' });

    await act(async () => {
      await result.current.datasource.getRows(getRowsParams(0, 25));
    });

    expect(JSON.stringify(queryOf(0).filter)).toContain('gpt');
  });

  test('asks the previous window for the block own values, once comparison is on', async () => {
    runQueryMock.mockResolvedValueOnce(answer(deploymentRows(2)) as never);
    const { result } = renderRows({ windows: { current: WINDOW, previous: PREVIOUS_WINDOW } });

    await act(async () => {
      await result.current.datasource.getRows(getRowsParams(0, 25));
    });

    expect(runQueryMock).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(queryOf(1).filter)).toContain('model-0');
  });

  test('asks it nothing while comparison is off', async () => {
    runQueryMock.mockResolvedValueOnce(answer(deploymentRows(2)) as never);
    const { result } = renderRows();

    await act(async () => {
      await result.current.datasource.getRows(getRowsParams(0, 25));
    });

    expect(runQueryMock).toHaveBeenCalledOnce();
  });

  test('says it is reading while a block is in flight, and stops when it lands', async () => {
    let release: ((rows: Record<string, unknown>[]) => void) | undefined;
    runQueryMock.mockImplementationOnce(
      () => new Promise((resolve) => (release = (rows) => resolve(answer(rows) as never))),
    );

    const { result } = renderRows();

    act(() => {
      void result.current.datasource.getRows(getRowsParams(0, 25));
    });

    await waitFor(() => expect(result.current.isLoadingBlock).toBe(true));

    await act(async () => {
      release?.(deploymentRows(3));
    });

    await waitFor(() => expect(result.current.isLoadingBlock).toBe(false));
  });

  test('stops saying so when a read throws between its two requests', async () => {
    runQueryMock.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderRows();
    const params = getRowsParams(0, 25);

    await act(async () => {
      await result.current.datasource.getRows(params);
    });

    await waitFor(() => expect(result.current.isLoadingBlock).toBe(false));
    expect(params.failCallback).toHaveBeenCalledOnce();
  });

  test('reports a failed read and tells the grid, rather than answering with no rows', async () => {
    runQueryMock.mockResolvedValueOnce({ isSuccess: false, result: null, error: 'nope' } as never);
    const { result } = renderRows();
    const params = getRowsParams(0, 25);

    await act(async () => {
      await result.current.datasource.getRows(params);
    });

    expect(NOTICE.report).toHaveBeenCalledWith('nope');
    expect(params.successCallback).not.toHaveBeenCalled();
    expect(params.failCallback).toHaveBeenCalledOnce();
  });

  test('keeps its identity when only the window total lands, so loaded blocks survive', () => {
    // The page memoizes its windows, so the only input changing here is the total — which arrives
    // after the rows do, and used to reset the grid and re-read from the first block.
    const windows = { current: WINDOW };
    const { result, rerender } = renderHook(
      ({ windowTotal }: { windowTotal: number | null }) =>
        useBreakdownDialogRows({
          view: UsageView.Llm,
          windows,
          tab: BreakdownTab.Models,
          windowTotal,
          searchTerm: '',
          notice: NOTICE,
        }),
      { initialProps: { windowTotal: null as number | null } },
    );
    const first = result.current.datasource;

    rerender({ windowTotal: 4200 });

    expect(result.current.datasource).toBe(first);
  });

  test('changes its key with the term, which is what drops the blocks in hand', () => {
    const { result: plain } = renderRows();
    const { result: searched } = renderRows({ searchTerm: 'gpt' });

    expect(plain.current.datasourceKey).not.toBe(searched.current.datasourceKey);
  });
});
