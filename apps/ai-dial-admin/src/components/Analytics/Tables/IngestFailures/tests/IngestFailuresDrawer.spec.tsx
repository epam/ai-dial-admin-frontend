import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CellClickedEvent, ColDef, GridOptions } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { listIngestFailures, retryIngestFailures } from '@/src/app/[lang]/tables/actions';
import IngestFailuresDrawer from '@/src/components/Analytics/Tables/IngestFailures/IngestFailuresDrawer';
import { IngestFailureRow, IngestFailureRowType } from '@/src/components/Analytics/Tables/IngestFailures/models';
import { ingestFailure, ingestList, SWEEP } from '@/src/components/Analytics/Tables/IngestFailures/tests/mock';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import {
  IngestFailure,
  IngestFailureFilters,
  IngestFailureKind,
  IngestFailureList,
  IngestFailureReason,
  IngestFailureState,
} from '@/src/models/analytics/ingest-failure';

vi.mock('@/src/app/[lang]/tables/actions');

interface Captured {
  options: GridOptions;
  columns: ColDef[];
}

const captured: Captured = { options: {}, columns: [] };

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ rowData, columnDefs, additionalGridOptions }: any) => {
    captured.options = additionalGridOptions;
    captured.columns = columnDefs;

    return (
      <section aria-label="grid">
        {rowData.map((row: IngestFailureRow) => (
          <div key={row.rowId}>
            {row.type === IngestFailureRowType.Failure
              ? columnDefs
                  .filter((column: ColDef) => column.cellRenderer)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .map((column: ColDef) => <div key={column.colId}>{(column.cellRenderer as any)({ data: row })}</div>)
              : additionalGridOptions.fullWidthCellRenderer({
                  data: row,
                  node: { rowHeight: 0, setRowHeight: vi.fn() },
                })}
          </div>
        ))}
      </section>
    );
  },
}));

const clickRow = (failure: IngestFailure, group: IngestFailureRow['group']) =>
  act(() =>
    captured.options.onCellClicked?.({
      data: { rowId: 'x', type: IngestFailureRowType.Failure, group, failure },
      column: { getColId: () => 'subject' },
    } as unknown as CellClickedEvent),
  );

const blob = ingestFailure({ subject: 'logs/a.gz', last_failed_at: '2026-11-04T09:00:00Z' });
const records = ingestFailure({
  subject: 'logs/a.gz',
  kind: IngestFailureKind.Records,
  reason: IngestFailureReason.SkippedRecords,
  last_failed_at: '2026-11-04T08:00:00Z',
});
const day = ingestFailure({
  kind: IngestFailureKind.Day,
  subject: '2026-11-03',
  reason: IngestFailureReason.ListingFailed,
  last_failed_at: '2026-11-04T07:00:00Z',
  message: undefined,
});
const waiting = ingestFailure({
  subject: 'logs/b.gz',
  state: IngestFailureState.Pending,
  reason: IngestFailureReason.ReadError,
  next_attempt_at: '2026-11-05T10:00:00Z',
});

const GROUP_TOTAL = 1200;

const answer = (parked: IngestFailure[], pending: IngestFailure[], overrides: Partial<IngestFailureList> = {}) => {
  vi.mocked(listIngestFailures).mockImplementation(async ({ state, limit }: IngestFailureFilters) => ({
    success: true,
    response:
      limit === 1
        ? ingestList([], { total: GROUP_TOTAL })
        : ingestList(state === IngestFailureState.Parked ? parked : pending, {
            by_state: { parked: parked.length, pending: pending.length },
            ...overrides,
          }),
  }));
};

const renderDrawer = (backfillRunId?: string) =>
  render(<IngestFailuresDrawer backfillRunId={backfillRunId} onClose={vi.fn()} />);

describe('IngestFailuresDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(retryIngestFailures).mockResolvedValue({ success: true, response: { requeued: 1, retry_sweep: SWEEP } });
  });

  test('summarizes both states from the service counts', async () => {
    answer([blob, day], [waiting], { by_state: { parked: 1500, pending: 2400 } });
    renderDrawer();

    expect(await screen.findByText(IngestFailuresI18nKey.NeedsRetry)).toBeTruthy();
    expect(screen.getByText('3900')).toBeTruthy();
    expect(screen.getByText(IngestFailuresI18nKey.ShownOf)).toBeTruthy();
    expect(screen.getByText(IngestFailuresI18nKey.RetryingAutomaticallyHint)).toBeTruthy();
  });

  test('states a switched-off retry pass', async () => {
    answer([blob], [waiting], { retry_sweep: { enabled: false, max_per_sweep: 500 } });
    renderDrawer();

    expect(await screen.findByText(IngestFailuresI18nKey.SweepOff)).toBeTruthy();
    expect(screen.getByText(IngestFailuresI18nKey.RetryingWaitingHint)).toBeTruthy();
  });

  test('groups by reason and kind and warns on a deterministic reason', async () => {
    answer([blob, records, day], []);
    renderDrawer();

    expect(
      await screen.findByRole('group', {
        name: `${IngestFailuresI18nKey.ReasonMappingError}, ${IngestFailuresI18nKey.KindBlob}`,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('group', {
        name: `${IngestFailuresI18nKey.ReasonSkippedRecords}, ${IngestFailuresI18nKey.KindRecords}`,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('group', {
        name: `${IngestFailuresI18nKey.ReasonListingFailed}, ${IngestFailuresI18nKey.KindDay}`,
      }),
    ).toBeTruthy();
    expect(screen.getAllByText(IngestFailuresI18nKey.DeterministicCaveat)).toHaveLength(2);
  });

  test('queues one failure without confirmation and reads again', async () => {
    const user = userEvent.setup();
    answer([records], []);
    renderDrawer();

    await user.click(await screen.findByRole('button', { name: IngestFailuresI18nKey.Retry }));

    expect(await screen.findByText(new RegExp(IngestFailuresI18nKey.Queued))).toBeTruthy();
    expect(retryIngestFailures).toHaveBeenCalledWith({
      targets: [{ kind: IngestFailureKind.Records, subject: 'logs/a.gz' }],
    });
    expect(screen.queryByText(IngestFailuresI18nKey.ConfirmBody)).toBeNull();
    expect(listIngestFailures).toHaveBeenCalledTimes(4);
  });

  test('confirms a group retry with the exact count and sends its filters', async () => {
    const user = userEvent.setup();
    answer([blob], []);
    renderDrawer();

    await user.click(await screen.findByRole('button', { name: IngestFailuresI18nKey.RetryAll }));

    expect(await screen.findByText(IngestFailuresI18nKey.ConfirmBody)).toBeTruthy();
    expect(await screen.findByRole('button', { name: IngestFailuresI18nKey.Retry })).toBeEnabled();
    expect(screen.getByText(IngestFailuresI18nKey.ConfirmTitle)).toBeTruthy();
    expect(screen.getAllByText(IngestFailuresI18nKey.DeterministicCaveat).length).toBeGreaterThan(1);

    await user.click(await screen.findByRole('button', { name: IngestFailuresI18nKey.Retry }));

    expect(await screen.findByText(new RegExp(IngestFailuresI18nKey.Queued))).toBeTruthy();
    expect(retryIngestFailures).toHaveBeenCalledWith({
      state: IngestFailureState.Parked,
      reason: IngestFailureReason.MappingError,
      kind: IngestFailureKind.Blob,
    });
  });

  test('cancelling a group retry sends nothing', async () => {
    const user = userEvent.setup();
    answer([blob], []);
    renderDrawer();

    await user.click(await screen.findByRole('button', { name: IngestFailuresI18nKey.RetryAll }));
    await user.click(await screen.findByRole('button', { name: 'Buttons.Cancel' }));

    expect(retryIngestFailures).not.toHaveBeenCalled();
  });

  test('retries a selection spanning kinds in one request', async () => {
    const user = userEvent.setup();
    answer([blob, records], []);
    renderDrawer();

    const rowBoxes = await screen.findAllByRole('checkbox', { name: IngestFailuresI18nKey.SelectRow });
    await user.click(rowBoxes[0]);
    await user.click(rowBoxes[1]);

    expect(screen.getByText(IngestFailuresI18nKey.Selected)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: IngestFailuresI18nKey.RetrySelected }));
    await user.click(await screen.findByRole('button', { name: IngestFailuresI18nKey.Retry }));

    expect(await screen.findByText(new RegExp(IngestFailuresI18nKey.Queued))).toBeTruthy();
    expect(retryIngestFailures).toHaveBeenCalledWith({
      targets: expect.arrayContaining([
        { kind: IngestFailureKind.Blob, subject: 'logs/a.gz' },
        { kind: IngestFailureKind.Records, subject: 'logs/a.gz' },
      ]),
    });
  });

  test('states a group as mixed and clears a selection', async () => {
    const user = userEvent.setup();
    const second = ingestFailure({ subject: 'logs/c.gz' });
    answer([blob, second], []);
    renderDrawer();

    const [first] = await screen.findAllByRole('checkbox', { name: IngestFailuresI18nKey.SelectRow });
    await user.click(first);

    const groupBox = screen.getByRole('checkbox', { name: IngestFailuresI18nKey.SelectGroup });
    expect(groupBox.getAttribute('aria-checked') === 'mixed' || (groupBox as HTMLInputElement).indeterminate).toBe(
      true,
    );

    await user.click(screen.getByRole('button', { name: IngestFailuresI18nKey.ClearSelection }));

    expect(screen.queryByRole('button', { name: IngestFailuresI18nKey.RetrySelected })).toBeNull();
  });

  test('opens a detail in place with the message and the backfill runs', async () => {
    answer([{ ...blob, backfill_run_ids: ['run-9'] }, day], []);
    renderDrawer();

    const header = await screen.findByRole('group', {
      name: `${IngestFailuresI18nKey.ReasonMappingError}, ${IngestFailuresI18nKey.KindBlob}`,
    });
    expect(header).toBeTruthy();

    await clickRow(
      { ...blob, backfill_run_ids: ['run-9'] },
      {
        key: 'mapping_error:blob',
        reason: blob.reason,
        kind: blob.kind,
        failures: [blob],
        newestAt: blob.last_failed_at,
      },
    );

    expect(await screen.findByText('bad line')).toBeTruthy();
    expect(screen.getByText('run-9')).toBeTruthy();

    await clickRow(day, {
      key: 'listing_failed:day',
      reason: day.reason,
      kind: day.kind,
      failures: [day],
      newestAt: day.last_failed_at,
    });

    expect(await screen.findByText(IngestFailuresI18nKey.NoMessage)).toBeTruthy();
  });

  test('expands the automatic retries without selection or retry', async () => {
    const user = userEvent.setup();
    answer([], [waiting]);
    renderDrawer();

    const toggle = await screen.findByRole('button', { name: IngestFailuresI18nKey.ShowPending });
    expect(screen.getByText(IngestFailuresI18nKey.NothingNeedsRetry)).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    await user.click(toggle);

    const grid = screen.getByRole('region', { name: 'grid' });
    expect(within(grid).queryByRole('checkbox')).toBeNull();
    expect(within(grid).queryByRole('button', { name: IngestFailuresI18nKey.Retry })).toBeNull();
    expect(captured.columns.map((column) => column.headerName)).toEqual(
      expect.arrayContaining([IngestFailuresI18nKey.LastFailed, IngestFailuresI18nKey.NextAttempt]),
    );
  });

  test('narrows to a run, carries it on the group retry and drops it on dismissal', async () => {
    const user = userEvent.setup();
    answer([blob], []);
    renderDrawer('run-1');

    expect(await screen.findByText(IngestFailuresI18nKey.RunFilter)).toBeTruthy();
    expect(listIngestFailures).toHaveBeenCalledWith(expect.objectContaining({ backfill_run_id: 'run-1' }));

    await user.click(screen.getByRole('button', { name: IngestFailuresI18nKey.RetryAll }));
    expect(await screen.findByText(IngestFailuresI18nKey.ConfirmRun)).toBeTruthy();
    await user.click(await screen.findByRole('button', { name: IngestFailuresI18nKey.Retry }));
    expect(await screen.findByText(new RegExp(IngestFailuresI18nKey.Queued))).toBeTruthy();
    expect(retryIngestFailures).toHaveBeenCalledWith(expect.objectContaining({ backfill_run_id: 'run-1' }));

    vi.mocked(listIngestFailures).mockClear();
    await user.click(screen.getByRole('button', { name: IngestFailuresI18nKey.ClearRun }));

    await vi.waitFor(() =>
      expect(listIngestFailures).toHaveBeenCalledWith(expect.objectContaining({ backfill_run_id: undefined })),
    );
  });

  test('hides the failures of the narrowed run while the unfiltered read is in flight', async () => {
    const user = userEvent.setup();
    answer([blob], []);
    renderDrawer('run-1');

    expect(await screen.findByRole('button', { name: IngestFailuresI18nKey.RetryAll })).toBeTruthy();

    vi.mocked(listIngestFailures).mockImplementation(() => new Promise(() => {}));
    await user.click(screen.getByRole('button', { name: IngestFailuresI18nKey.ClearRun }));

    expect(await screen.findByLabelText(IngestFailuresI18nKey.Loading)).toBeTruthy();
    expect(screen.queryByRole('button', { name: IngestFailuresI18nKey.RetryAll })).toBeNull();
  });

  test('states the first read in progress', async () => {
    vi.mocked(listIngestFailures).mockImplementation(() => new Promise(() => {}));
    renderDrawer();

    expect(await screen.findByLabelText(IngestFailuresI18nKey.Loading)).toBeTruthy();
    expect(screen.queryByText(IngestFailuresI18nKey.None)).toBeNull();
  });

  test('states a service that does not report ingest failures', async () => {
    vi.mocked(listIngestFailures).mockResolvedValue({ success: false, status: 404 });
    renderDrawer();

    expect(await screen.findByText(IngestFailuresI18nKey.Unavailable)).toBeTruthy();
    expect(screen.queryByText(IngestFailuresI18nKey.None)).toBeNull();
    expect(screen.queryByText(IngestFailuresI18nKey.ReadFailed)).toBeNull();
  });

  test('states that there are no failures', async () => {
    answer([], []);
    renderDrawer();

    expect(await screen.findByText(IngestFailuresI18nKey.None)).toBeTruthy();
    expect(screen.queryByRole('button', { name: IngestFailuresI18nKey.Retry })).toBeNull();
  });

  test('states that a narrowed run has nothing outstanding', async () => {
    answer([], []);
    renderDrawer('run-1');

    expect(await screen.findByText(IngestFailuresI18nKey.NoneInRun)).toBeTruthy();
  });

  test('states a failed read in place and not as no failures', async () => {
    vi.mocked(listIngestFailures).mockResolvedValue({ success: false, status: 500, errorMessage: 'down' });
    renderDrawer();

    expect(await screen.findByText(IngestFailuresI18nKey.ReadFailed)).toBeTruthy();
    expect(screen.getByRole('button', { name: IngestFailuresI18nKey.ReadAgain })).toBeTruthy();
    expect(screen.queryByText(IngestFailuresI18nKey.None)).toBeNull();
    expect(useNotification().showNotification).toHaveBeenCalledOnce();
  });

  test('reports a refused retry by notification', async () => {
    const user = userEvent.setup();
    vi.mocked(retryIngestFailures).mockResolvedValue({ success: false, status: 403, errorMessage: 'no' });
    answer([blob], []);
    renderDrawer();

    await user.click(await screen.findByRole('button', { name: IngestFailuresI18nKey.Retry }));

    await vi.waitFor(() => expect(useNotification().showNotification).toHaveBeenCalledOnce());
  });
});
