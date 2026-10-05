import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CellClickedEvent, ColDef, GridOptions } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import FailuresGrid from '@/src/components/Analytics/Pipelines/Failures/FailuresGrid';
import { PipelineFailuresRead } from '@/src/components/Analytics/Pipelines/Failures/use-pipeline-failures';
import { dlqItem, failuresRead } from '@/src/components/Analytics/Pipelines/Failures/tests/mock';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { DlqLane } from '@/src/models/analytics/pipeline-dlq';

/**
 * ag-grid is replaced by a harness that keeps what the grid is configured with and renders each row
 * through the column's own cell renderer, so the controls under test are the real ones.
 */
interface Captured {
  rowData: { rowId: string; isDetail: boolean }[];
  columnDefs: ColDef[];
  options: GridOptions;
}

const captured: Captured = { rowData: [], columnDefs: [], options: {} };

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ rowData, columnDefs, additionalGridOptions, getIsEmptyData, emptyDataProps }: any) => {
    captured.rowData = rowData;
    captured.columnDefs = columnDefs;
    captured.options = additionalGridOptions;

    if (getIsEmptyData?.()) return <section aria-label="empty">{emptyDataProps?.title}</section>;

    return (
      <section aria-label="grid">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {rowData.map((row: any) => (
          <div key={row.rowId}>
            {row.isDetail
              ? additionalGridOptions.fullWidthCellRenderer({
                  data: row,
                  node: { rowHeight: 0, setRowHeight: vi.fn() },
                })
              : columnDefs
                  .filter((column: ColDef) => column.cellRenderer)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .map((column: ColDef) => <div key={column.colId}>{(column.cellRenderer as any)({ data: row })}</div>)}
          </div>
        ))}
      </section>
    );
  },
}));

const renderGrid = (failures: PipelineFailuresRead, props: Partial<Parameters<typeof FailuresGrid>[0]> = {}) =>
  render(
    <FailuresGrid
      failures={failures}
      search=""
      isBusy={false}
      now={Date.parse('2026-10-02T10:30:00Z')}
      onSearchChange={vi.fn()}
      onRetryOne={vi.fn()}
      onRetryRun={vi.fn()}
      {...props}
    />,
  );

/** What ag-grid reports when its body is scrolled, with the viewport it is left showing. */
const scrollTo = ({ last, count }: { last: number; count: number }) =>
  act(() => {
    captured.options.onBodyScroll?.({
      api: {
        isDestroyed: () => false,
        getLastDisplayedRowIndex: () => last,
        getDisplayedRowCount: () => count,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

/** What ag-grid would do for a click on a cell of the given column: its own listener, outside React. */
const clickCell = (colId: string, rowIndex = 0) =>
  act(() => {
    captured.options.onCellClicked?.({
      data: captured.rowData[rowIndex],
      column: { getColId: () => colId },
    } as unknown as CellClickedEvent);
  });

describe('FailuresGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.rowData = [];
  });

  test('lists the rows the read loaded', () => {
    renderGrid(failuresRead({ items: [dlqItem({ id: 1 }), dlqItem({ id: 2 })] }));

    expect(captured.rowData).toHaveLength(2);
  });

  // The chevron is a real button, and it is the only thing that toggles from that cell: ag-grid's own
  // cell listener fires for the same click, and two toggles cancelled each other out.
  test('opens the detail from the chevron, once', async () => {
    const user = userEvent.setup();
    renderGrid(failuresRead({ items: [dlqItem({ id: 1 })] }));

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresShowRow }));

    expect(captured.rowData).toHaveLength(2);
    expect(captured.rowData[1].isDetail).toBe(true);
  });

  test('ignores a cell click on the chevron column, which the button already handles', () => {
    renderGrid(failuresRead({ items: [dlqItem({ id: 1 })] }));

    clickCell('details');

    expect(captured.rowData).toHaveLength(1);
  });

  test('opens the detail from a click anywhere else in the row', () => {
    renderGrid(failuresRead({ items: [dlqItem({ id: 1 })] }));

    clickCell('error');

    expect(captured.rowData).toHaveLength(2);
  });

  test('leaves the retry cell to its own control', () => {
    renderGrid(failuresRead({ items: [dlqItem({ id: 1 })] }));

    clickCell('retry');

    expect(captured.rowData).toHaveLength(1);
  });

  test('offers a retry only on a row the service stored a payload for', () => {
    renderGrid(failuresRead({ items: [dlqItem({ id: 1, requeueable: false })] }));

    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetry })).toBeNull();
  });

  test('re-runs one failure from its row', async () => {
    const user = userEvent.setup();
    const onRetryOne = vi.fn();
    renderGrid(failuresRead({ items: [dlqItem({ id: 48226 })] }), { onRetryOne });

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetry }));

    expect(onRetryOne).toHaveBeenCalledWith(48226);
  });

  test('narrows the request when a path is chosen', async () => {
    const user = userEvent.setup();
    const failures = failuresRead({ items: [dlqItem()] });
    renderGrid(failures);

    await user.click(screen.getByRole('combobox', { name: AnalyticsPipelinesI18nKey.FailuresPath }));
    await user.click(screen.getByRole('option', { name: AnalyticsPipelinesI18nKey.FailuresPathBackfill }));

    expect(failures.setLane).toHaveBeenCalledWith(DlqLane.Backfill);
  });

  test('replaces the path control with the run while a run filter is in force', () => {
    renderGrid(failuresRead({ items: [dlqItem({ run_id: 'run-7' })], filters: { runId: 'run-7' } }));

    expect(screen.queryByRole('combobox', { name: AnalyticsPipelinesI18nKey.FailuresPath })).toBeNull();
    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresClearRun })).toBeTruthy();
  });

  test('states that nothing matches the search and offers to clear it', () => {
    renderGrid(failuresRead({ items: [dlqItem({ error: 'rate limit' })] }), { search: 'nothing' });

    expect(screen.getByRole('region', { name: 'empty' }).textContent).toContain(
      AnalyticsPipelinesI18nKey.FailuresNoMatch,
    );
    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresClearFilters })).toBeTruthy();
  });

  test('offers to widen a live path that holds nothing', () => {
    renderGrid(failuresRead({ items: [], filters: { lane: DlqLane.Live } }));

    expect(screen.getByRole('region', { name: 'empty' }).textContent).toContain(
      AnalyticsPipelinesI18nKey.FailuresNoneLive,
    );
    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresShowAllPaths })).toBeTruthy();
  });

  test('offers to clear a run filter whose failures have all been re-run', () => {
    renderGrid(failuresRead({ items: [], filters: { runId: 'run-7' } }));

    expect(screen.getByRole('region', { name: 'empty' }).textContent).toContain(
      AnalyticsPipelinesI18nKey.FailuresNoneInRun,
    );
  });

  // The page is a window; the next one arrives when the reader reaches the end of this one. Driven
  // by ag-grid's own scroll event now, because the grid owns its scrollbar.
  test('asks for the next page when the listing is scrolled to its end', () => {
    const failures = failuresRead({ items: [dlqItem()], hasMore: true });
    renderGrid(failures);

    scrollTo({ last: 19, count: 20 });

    expect(failures.loadMore).toHaveBeenCalled();
  });

  test('does not ask for the next page while the reader is still mid-list', () => {
    const failures = failuresRead({ items: [dlqItem()], hasMore: true });
    renderGrid(failures);

    scrollTo({ last: 2, count: 20 });

    expect(failures.loadMore).not.toHaveBeenCalled();
  });

  // A search can narrow the listing below the height that scrolls at all, and it covers only the
  // pages already loaded, so scrolling cannot be the only way to the rest of them.
  test('offers an explicit control while the service has more to give', async () => {
    const user = userEvent.setup();
    const failures = failuresRead({ items: [dlqItem()], hasMore: true });
    renderGrid(failures);

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresLoadMore }));

    expect(failures.loadMore).toHaveBeenCalled();
  });

  test('offers no such control once the listing is complete', () => {
    renderGrid(failuresRead({ items: [dlqItem()], hasMore: false }));

    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresLoadMore })).toBeNull();
  });

  // Counted from the rows it would be the page's count, and the control and its confirmation would
  // then quote two numbers for one action.
  test('asks the service how many of a run it would re-run', async () => {
    const failures = failuresRead({ items: [dlqItem({ id: 1, run_id: 'run-7' })] });
    renderGrid(failures);

    clickCell('error');

    await waitFor(() => expect(failures.readRunRetryable).toHaveBeenCalledWith('run-7'));
  });
});
