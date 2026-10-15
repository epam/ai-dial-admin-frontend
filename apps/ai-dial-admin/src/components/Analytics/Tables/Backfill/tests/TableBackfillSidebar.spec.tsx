import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { listTableBackfillRuns, startTableBackfill } from '@/src/app/[lang]/tables/actions';
import TableBackfillSidebar from '@/src/components/Analytics/Tables/Backfill/TableBackfillSidebar';
import { BackfillI18nKey } from '@/src/constants/i18n';
import en from '@/src/locales/en';
import { TableBackfillRun, TableBackfillState } from '@/src/models/analytics/table-backfill';

vi.mock('@/src/app/[lang]/tables/actions');

const showNotification = vi.hoisted(() => vi.fn());
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

// The picker is the kit's; here it stands in as a text field holding a `yyyy-MM-dd` day, so a test can set a date.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
    Calendar: ({
      labelProps,
      value,
      onChange,
      invalid,
    }: {
      labelProps?: { label?: string };
      value?: Date | null;
      onChange?: (value: Date | null) => void;
      invalid?: boolean;
    }) => (
      <input
        aria-label={labelProps?.label}
        aria-invalid={invalid}
        value={
          value instanceof Date ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` : ''
        }
        onChange={(e) => {
          const [y, m, d] = e.target.value.split('-').map(Number);
          onChange?.(e.target.value ? new Date(y, m - 1, d) : null);
        }}
      />
    ),
  };
});

const makeRun = (overrides: Partial<TableBackfillRun> = {}): TableBackfillRun => ({
  runId: 'run-1',
  from: '2026-09-01',
  to: '2026-09-30',
  daysTotal: 30,
  state: TableBackfillState.Completed,
  daysCompleted: 30,
  daysFailed: 0,
  filesProcessed: 120,
  rowsInserted: 5000,
  rowsSkipped: 0,
  rowsDropped: 0,
  startedAt: '2026-09-24T10:00:00Z',
  finishedAt: '2026-09-24T11:00:00Z',
  ...overrides,
});

const serve = (runs: TableBackfillRun[]) =>
  vi.mocked(listTableBackfillRuns).mockResolvedValue({ success: true, response: runs });

const renderSidebar = async (runs: TableBackfillRun[]) => {
  serve(runs);
  const props = { onRunsChange: vi.fn() };
  const view = render(<TableBackfillSidebar {...props} />);

  if (runs.length > 0) await screen.findByRole('heading', { name: BackfillI18nKey.SectionRun });
  await vi.waitFor(() => expect(props.onRunsChange).toHaveBeenCalled());

  return { ...view, ...props };
};

const setRange = (from: string, to: string) => {
  fireEvent.change(screen.getByLabelText(BackfillI18nKey.FieldFrom), { target: { value: from } });
  fireEvent.change(screen.getByLabelText(BackfillI18nKey.FieldTo), { target: { value: to } });
};

describe('TableBackfillSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('which run is presented', () => {
    test('presents the run in progress and withholds the start form', async () => {
      await renderSidebar([
        makeRun({ runId: 'run-2', state: TableBackfillState.Running, daysCompleted: 11, currentDate: '2026-09-12' }),
        makeRun({ runId: 'run-1' }),
      ]);

      expect(screen.getAllByText(BackfillI18nKey.StatusRunning).length).toBeGreaterThan(0);
      expect(screen.getByText(BackfillI18nKey.CurrentDay)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Start })).toBeNull();
    });

    test('lists every retained run below the presented one', async () => {
      await renderSidebar([
        makeRun({ runId: 'run-2', from: '2026-08-01', to: '2026-08-30' }),
        makeRun({ runId: 'run-1' }),
      ]);

      const list = screen.getByRole('region', { name: BackfillI18nKey.RecentRuns });

      expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    });

    test('presents the newest run and offers the start form when none is in progress', async () => {
      await renderSidebar([makeRun({ runId: 'run-2', from: '2026-08-01', to: '2026-08-30' }), makeRun()]);

      expect(screen.getAllByText('2026-08-01 → 2026-08-30').length).toBeGreaterThan(1);
      expect(screen.getByRole('button', { name: BackfillI18nKey.Start })).toBeInTheDocument();
    });

    test('presents the run the reader chooses from the list', async () => {
      const user = userEvent.setup();
      await renderSidebar([makeRun({ runId: 'run-2', from: '2026-08-01', to: '2026-08-30' }), makeRun()]);

      await user.click(screen.getByRole('button', { name: /2026-09-01 → 2026-09-30/ }));

      expect(screen.getByRole('button', { name: /2026-09-01 → 2026-09-30/ })).toHaveAttribute('aria-current', 'true');
      expect(screen.getByRole('button', { name: /2026-08-01 → 2026-08-30/ })).toHaveAttribute('aria-current', 'false');
    });

    test('offers only the form, with no list section at all, when the service retains no run', async () => {
      await renderSidebar([]);

      expect(screen.getByRole('button', { name: BackfillI18nKey.Start })).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: BackfillI18nKey.RecentRuns })).toBeNull();
      expect(screen.queryByRole('region', { name: BackfillI18nKey.SectionRun })).toBeNull();
    });

    test('splits the sidebar into the run, the form and the list, each its own labelled block', async () => {
      await renderSidebar([makeRun()]);

      const run = screen.getByRole('region', { name: BackfillI18nKey.SectionRun });
      const form = screen.getByRole('region', { name: BackfillI18nKey.SectionStart });
      const list = screen.getByRole('region', { name: BackfillI18nKey.RecentRuns });

      expect(within(run).getByText('run-1')).toBeInTheDocument();
      expect(within(form).getByRole('button', { name: BackfillI18nKey.Start })).toBeInTheDocument();
      expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    });

    test('puts the start form first, then the run, then the list', async () => {
      await renderSidebar([makeRun()]);

      expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
        BackfillI18nKey.SectionStart,
        BackfillI18nKey.SectionRun,
        BackfillI18nKey.RecentRuns,
      ]);
    });

    test('drops the form block while a run is in progress', async () => {
      await renderSidebar([makeRun({ state: TableBackfillState.Running })]);

      expect(screen.queryByRole('region', { name: BackfillI18nKey.SectionStart })).toBeNull();
      expect(screen.getByRole('region', { name: BackfillI18nKey.SectionRun })).toBeInTheDocument();
    });

    test('says nothing under the list about how long the service keeps its runs', async () => {
      await renderSidebar([makeRun()]);

      const list = screen.getByRole('region', { name: BackfillI18nKey.RecentRuns });

      expect(within(list).queryByText(/memory|restart|instance/i)).toBeNull();
      expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    });

    test('gives the run id a copy control', async () => {
      await renderSidebar([makeRun()]);

      expect(screen.getByText('run-1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: `copy ${BackfillI18nKey.RunId}` })).toBeInTheDocument();
    });
  });

  describe('a service that retains runs with different outcomes', () => {
    const outcomes: TableBackfillRun[] = [
      makeRun({
        runId: 'running',
        from: '2026-10-01',
        to: '2026-10-30',
        state: TableBackfillState.Running,
        daysCompleted: 11,
        currentDate: '2026-10-12',
        finishedAt: null,
      }),
      makeRun({
        runId: 'done-with-failed-days',
        from: '2026-09-01',
        to: '2026-09-30',
        daysCompleted: 28,
        daysFailed: 2,
        failedDates: ['2026-09-04', '2026-09-17'],
      }),
      makeRun({
        runId: 'stopped-early',
        from: '2026-08-01',
        to: '2026-08-30',
        state: TableBackfillState.Failed,
        daysCompleted: 12,
        daysFailed: 1,
        failedDates: ['2026-08-13'],
      }),
      makeRun({
        runId: 'nothing-written',
        from: '2026-07-01',
        to: '2026-07-10',
        daysTotal: 10,
        daysCompleted: 10,
        filesProcessed: 0,
        rowsInserted: 0,
      }),
      makeRun({ runId: 'clean', from: '2026-06-01', to: '2026-06-30', rowsSkipped: 37, rowsDropped: 4 }),
    ];

    test('lists every outcome with its status and the days it finished against the total', async () => {
      await renderSidebar(outcomes);

      const rows = within(screen.getByRole('region', { name: BackfillI18nKey.RecentRuns })).getAllByRole('listitem');
      const text = rows.map((row) => row.textContent);

      expect(text).toEqual([
        `${BackfillI18nKey.StatusRunning}2026-10-01 → 2026-10-3011 / 30`,
        `${BackfillI18nKey.StatusDone}2026-09-01 → 2026-09-3030 / 30`,
        `${BackfillI18nKey.StatusFailed}2026-08-01 → 2026-08-3013 / 30`,
        `${BackfillI18nKey.StatusDone}2026-07-01 → 2026-07-1010 / 10`,
        `${BackfillI18nKey.StatusDone}2026-06-01 → 2026-06-3030 / 30`,
      ]);
    });

    test.each([
      ['running', [BackfillI18nKey.StatusRunning, BackfillI18nKey.CurrentDay], [BackfillI18nKey.Rerun]],
      ['done-with-failed-days', [BackfillI18nKey.StatusDone], [BackfillI18nKey.AlreadyIngested]],
      ['stopped-early', [BackfillI18nKey.StatusFailed], [BackfillI18nKey.AlreadyIngested]],
      ['nothing-written', [BackfillI18nKey.StatusDone, BackfillI18nKey.AlreadyIngested], []],
      ['clean', [BackfillI18nKey.StatusDone, BackfillI18nKey.RowsSkipped], [BackfillI18nKey.AlreadyIngested]],
    ])('presents the %s run with what applies to it and nothing that does not', async (runId, shown, hidden) => {
      const user = userEvent.setup();
      await renderSidebar(outcomes);
      const index = outcomes.findIndex((run) => run.runId === runId);

      await user.click(
        within(screen.getByRole('region', { name: BackfillI18nKey.RecentRuns })).getAllByRole('button')[index],
      );

      const run = screen.getByRole('region', { name: BackfillI18nKey.SectionRun });

      shown.forEach((key) => expect(within(run).getAllByText(key).length).toBeGreaterThan(0));
      hidden.forEach((key) => expect(within(run).queryByText(key)).toBeNull());
    });

    test('offers a re-run only on the runs that carry failed days, and not while another run is in progress', async () => {
      const user = userEvent.setup();
      const settled = outcomes.slice(1);
      await renderSidebar(settled);
      const buttons = () =>
        within(screen.getByRole('region', { name: BackfillI18nKey.RecentRuns })).getAllByRole('button');

      await user.click(buttons()[0]);
      expect(screen.getByRole('button', { name: BackfillI18nKey.Rerun })).toBeInTheDocument();

      await user.click(buttons()[1]);
      expect(screen.getByRole('button', { name: BackfillI18nKey.Rerun })).toBeInTheDocument();

      await user.click(buttons()[2]);
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Rerun })).toBeNull();

      await user.click(buttons()[3]);
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Rerun })).toBeNull();
    });
  });

  describe('how a run reads', () => {
    test('presents Completed as Done', async () => {
      await renderSidebar([makeRun()]);

      expect(screen.getAllByText(BackfillI18nKey.StatusDone).length).toBeGreaterThan(0);
    });

    test('presents a run that ended before its range as Failed whatever its counts sum to', async () => {
      // A run that stopped on its last day: completed and failed days sum to the total, and it is still failed.
      await renderSidebar([
        makeRun({
          state: TableBackfillState.Failed,
          daysCompleted: 29,
          daysFailed: 1,
          failedDates: ['2026-09-30'],
        }),
      ]);

      expect(screen.getAllByText(BackfillI18nKey.StatusFailed).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(BackfillI18nKey.StatusDone)).toHaveLength(0);
    });

    test('does not present a Done run with failed days as clean: its failed days read as a failure', async () => {
      await renderSidebar([makeRun({ daysCompleted: 28, daysFailed: 2, failedDates: ['2026-09-04', '2026-09-17'] })]);

      const days = within(screen.getByRole('region', { name: BackfillI18nKey.SectionRun })).getByText(
        BackfillI18nKey.DaysFailed,
      );

      expect((days.closest('div') as HTMLElement).querySelector('dd')).toHaveClass('text-error');
    });

    test('does not list the failed days anywhere in the run block', async () => {
      await renderSidebar([makeRun({ daysCompleted: 28, daysFailed: 2, failedDates: ['2026-09-04', '2026-09-17'] })]);

      const run = screen.getByRole('region', { name: BackfillI18nKey.SectionRun });

      expect(within(run).queryByText('2026-09-04')).toBeNull();
      expect(within(run).queryByText('2026-09-17')).toBeNull();
    });

    test('names the re-run for what it repeats, without a date', async () => {
      await renderSidebar([makeRun({ daysCompleted: 28, daysFailed: 2, failedDates: ['2026-09-04'] })]);

      expect(screen.getByRole('button', { name: BackfillI18nKey.Rerun })).toBeInTheDocument();
    });

    test('says a run that wrote nothing may have covered an already-ingested or empty range', async () => {
      await renderSidebar([makeRun({ filesProcessed: 0, rowsInserted: 0 })]);

      expect(screen.getByText(BackfillI18nKey.AlreadyIngested)).toBeInTheDocument();
    });

    test('does not say so for a run that processed files', async () => {
      await renderSidebar([makeRun()]);

      expect(screen.queryByText(BackfillI18nKey.AlreadyIngested)).toBeNull();
    });

    test('explains skipped and dropped rows behind an info icon beside their labels, not in a paragraph', async () => {
      await renderSidebar([makeRun({ rowsSkipped: 37, rowsDropped: 4 })]);

      expect(screen.getByRole('button', { name: BackfillI18nKey.SkippedHint })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: BackfillI18nKey.DroppedHint })).toBeInTheDocument();
      expect(screen.queryByText(BackfillI18nKey.SkippedHint)).toBeNull();
    });

    test('puts nothing yellow beside the status of a Done run that has failed days', async () => {
      await renderSidebar([makeRun({ daysCompleted: 28, daysFailed: 2, failedDates: ['2026-09-04', '2026-09-17'] })]);

      const run = screen.getByRole('region', { name: BackfillI18nKey.SectionRun });

      expect(within(run).queryByText(/days failed/i)).toBeNull();
    });
  });

  describe('the run’s facts', () => {
    const run = () => screen.getByRole('region', { name: BackfillI18nKey.SectionRun });
    const valueOf = (label: string) =>
      (within(run()).getByText(label).closest('div') as HTMLElement).querySelector('dd');

    test('are in one order, with the id and the window first and the times last', async () => {
      await renderSidebar([makeRun()]);

      expect(
        within(run())
          .getAllByRole('term')
          .map((term) => term.textContent),
      ).toEqual([
        BackfillI18nKey.RunId,
        BackfillI18nKey.Window,
        BackfillI18nKey.DaysTotal,
        BackfillI18nKey.DaysCompleted,
        BackfillI18nKey.DaysFailed,
        BackfillI18nKey.RowsInserted,
        BackfillI18nKey.RowsSkipped,
        BackfillI18nKey.RowsDropped,
        BackfillI18nKey.FilesProcessed,
        BackfillI18nKey.StartedAt,
        BackfillI18nKey.FinishedAt,
      ]);
    });

    test('call the range the window, as the pipeline sidebar does', async () => {
      await renderSidebar([makeRun()]);

      expect(within(run()).getByText(BackfillI18nKey.Window)).toBeInTheDocument();
      expect(within(run()).queryByText('Backfill.Range')).toBeNull();
    });

    test('show days total, completed and failed in one row', async () => {
      await renderSidebar([makeRun({ daysCompleted: 28, daysFailed: 2, failedDates: ['2026-09-04'] })]);

      const row = within(run()).getByText(BackfillI18nKey.DaysCompleted).closest('dl') as HTMLElement;

      expect(
        within(row)
          .getAllByRole('term')
          .map((term) => term.textContent),
      ).toEqual([BackfillI18nKey.DaysTotal, BackfillI18nKey.DaysCompleted, BackfillI18nKey.DaysFailed]);
    });

    test('show rows inserted, skipped and dropped in one row, as the days are', async () => {
      await renderSidebar([makeRun({ rowsSkipped: 37, rowsDropped: 4 })]);

      const row = within(run()).getByText(BackfillI18nKey.RowsInserted).closest('dl') as HTMLElement;

      expect(
        within(row)
          .getAllByRole('term')
          .map((term) => term.textContent),
      ).toEqual([BackfillI18nKey.RowsInserted, BackfillI18nKey.RowsSkipped, BackfillI18nKey.RowsDropped]);
    });

    test('show when it started and finished in one row of their own', async () => {
      await renderSidebar([makeRun()]);

      const row = within(run()).getByText(BackfillI18nKey.StartedAt).closest('dl') as HTMLElement;

      expect(
        within(row)
          .getAllByRole('term')
          .map((term) => term.textContent),
      ).toEqual([BackfillI18nKey.StartedAt, BackfillI18nKey.FinishedAt]);
    });

    test('colour what went through green and what failed red', async () => {
      await renderSidebar([makeRun({ daysCompleted: 28, daysFailed: 2, failedDates: ['2026-09-04'] })]);

      expect(valueOf(BackfillI18nKey.DaysCompleted)).toHaveClass('text-success');
      expect(valueOf(BackfillI18nKey.DaysFailed)).toHaveClass('text-error');
      expect(valueOf(BackfillI18nKey.DaysTotal)).toHaveClass('text-primary');
    });

    test('leave a count of zero failed days uncoloured', async () => {
      await renderSidebar([makeRun()]);

      expect(valueOf(BackfillI18nKey.DaysFailed)).toHaveClass('text-primary');
      expect(valueOf(BackfillI18nKey.DaysFailed)).not.toHaveClass('text-error');
    });
  });

  describe('re-running from the first failed day', () => {
    test('offers a re-run from the earliest failed day for a Done run with failed days', async () => {
      await renderSidebar([makeRun({ daysFailed: 2, daysCompleted: 28, failedDates: ['2026-09-17', '2026-09-04'] })]);

      expect(screen.getByRole('button', { name: BackfillI18nKey.Rerun })).toBeInTheDocument();
    });

    test('starts the re-run from the earliest failed day through the original end', async () => {
      const user = userEvent.setup();
      vi.mocked(startTableBackfill).mockResolvedValue({ success: true });
      await renderSidebar([makeRun({ daysFailed: 2, daysCompleted: 28, failedDates: ['2026-09-17', '2026-09-04'] })]);

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Rerun }));

      expect(startTableBackfill).toHaveBeenCalledWith('2026-09-04', '2026-09-30');
    });

    test('covers the days a stopped run never reached', async () => {
      const user = userEvent.setup();
      vi.mocked(startTableBackfill).mockResolvedValue({ success: true });
      await renderSidebar([
        makeRun({
          state: TableBackfillState.Failed,
          daysCompleted: 12,
          daysFailed: 2,
          failedDates: ['2026-09-04', '2026-09-17'],
        }),
      ]);

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Rerun }));

      expect(startTableBackfill).toHaveBeenCalledWith('2026-09-04', '2026-09-30');
    });

    test('offers no re-run for a clean Done run', async () => {
      await renderSidebar([makeRun()]);

      expect(screen.queryByRole('button', { name: BackfillI18nKey.Rerun })).toBeNull();
    });

    test('offers no re-run while another run is in progress', async () => {
      const user = userEvent.setup();
      await renderSidebar([
        makeRun({ runId: 'run-2', state: TableBackfillState.Running }),
        makeRun({ daysFailed: 2, daysCompleted: 28, failedDates: ['2026-09-04'] }),
      ]);

      await user.click(screen.getByRole('button', { name: new RegExp(BackfillI18nKey.StatusDone) }));

      expect(screen.queryByRole('button', { name: BackfillI18nKey.Rerun })).toBeNull();
    });
  });

  describe('the start form', () => {
    test('keeps Start off until both dates are chosen', async () => {
      await renderSidebar([]);

      expect(screen.getByRole('button', { name: BackfillI18nKey.Start })).toBeDisabled();
    });

    test('enables Start for a valid range and states how many days it covers', async () => {
      await renderSidebar([]);

      setRange('2026-09-01', '2026-09-30');

      expect(screen.getByRole('button', { name: BackfillI18nKey.Start })).toBeEnabled();
      expect(screen.getByText(BackfillI18nKey.RangeSummary)).toBeInTheDocument();
    });

    test('states a one-day range in the singular', async () => {
      await renderSidebar([]);

      setRange('2026-09-10', '2026-09-10');

      expect(screen.getByText(BackfillI18nKey.RangeSummaryOne)).toBeInTheDocument();
    });

    test('disables Start and says why for an inverted range', async () => {
      await renderSidebar([]);

      setRange('2026-09-10', '2026-09-09');

      expect(screen.getByRole('button', { name: BackfillI18nKey.Start })).toBeDisabled();
      expect(screen.getByRole('alert')).toHaveTextContent(BackfillI18nKey.RangeIssueInverted);
    });

    test('disables Start and says why for a last date in the future', async () => {
      await renderSidebar([]);

      setRange('2026-09-10', '2999-01-01');

      expect(screen.getByRole('button', { name: BackfillI18nKey.Start })).toBeDisabled();
      expect(screen.getByRole('alert')).toHaveTextContent(BackfillI18nKey.RangeIssueInFuture);
    });

    test('disables Start and says why for a range longer than the span limit', async () => {
      await renderSidebar([]);

      setRange('2024-01-01', '2026-09-01');

      expect(screen.getByRole('button', { name: BackfillI18nKey.Start })).toBeDisabled();
      expect(screen.getByRole('alert')).toHaveTextContent(BackfillI18nKey.RangeIssueTooLong);
    });

    test('states the service’s span limit, taken from one constant, in the message for a range that is too long', () => {
      expect(en.Backfill.RangeIssueTooLong).toContain('{days}');
    });

    test('shows no error for an empty form', async () => {
      await renderSidebar([]);

      expect(screen.queryByRole('alert')).toBeNull();
    });

    test('sends the two dates as dates and reads the runs again once the service accepts', async () => {
      const user = userEvent.setup();
      vi.mocked(startTableBackfill).mockResolvedValue({ success: true });
      await renderSidebar([]);
      setRange('2026-09-01', '2026-09-30');
      vi.mocked(listTableBackfillRuns).mockClear();

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Start }));

      expect(startTableBackfill).toHaveBeenCalledWith('2026-09-01', '2026-09-30');
      await vi.waitFor(() => expect(listTableBackfillRuns).toHaveBeenCalled());
    });

    test('shows the service’s own message when it refuses, and leaves the form as it was', async () => {
      const user = userEvent.setup();
      vi.mocked(startTableBackfill).mockResolvedValue({
        success: false,
        errorHeader: 'backfill_conflict',
        errorMessage: 'A run is already in progress',
        requestId: 'req-1',
      });
      await renderSidebar([]);
      setRange('2026-09-01', '2026-09-30');

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Start }));

      await vi.waitFor(() =>
        expect(showNotification).toHaveBeenCalledWith(
          expect.objectContaining({ description: 'A run is already in progress' }),
        ),
      );
      await waitFor(() => expect(screen.getByRole('button', { name: BackfillI18nKey.Start })).toBeEnabled());
      expect(screen.getByLabelText(BackfillI18nKey.FieldFrom)).toHaveValue('2026-09-01');
    });

    test('shows the refusal of a backfill that is switched off', async () => {
      const user = userEvent.setup();
      vi.mocked(startTableBackfill).mockResolvedValue({
        success: false,
        errorHeader: 'backfill_disabled',
        errorMessage: 'Backfill is disabled',
      });
      await renderSidebar([]);
      setRange('2026-09-01', '2026-09-30');

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Start }));

      await vi.waitFor(() =>
        expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ description: 'Backfill is disabled' })),
      );
    });
  });

  describe('reading', () => {
    test('hands every answer to the banner’s owner', async () => {
      const { onRunsChange } = await renderSidebar([makeRun()]);

      expect(onRunsChange).toHaveBeenCalledWith([expect.objectContaining({ runId: 'run-1' })]);
    });

    test('reports a failed read with the service’s message', async () => {
      vi.mocked(listTableBackfillRuns).mockResolvedValue({
        success: false,
        errorHeader: 'backfill_failed',
        errorMessage: 'service unavailable',
      });

      render(<TableBackfillSidebar onRunsChange={vi.fn()} />);

      await vi.waitFor(() =>
        expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ description: 'service unavailable' })),
      );
    });
  });
});
