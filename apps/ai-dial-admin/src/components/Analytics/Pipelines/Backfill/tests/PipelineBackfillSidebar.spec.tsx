import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  cancelPipelineBackfill,
  getPipelineFailures,
  listPipelineBackfills,
  pausePipelineBackfill,
  requeueFailures,
  resumePipelineBackfill,
  startPipelineBackfill,
} from '@/src/app/[lang]/pipelines/actions';
import PipelineBackfillSidebar from '@/src/components/Analytics/Pipelines/Backfill/PipelineBackfillSidebar';
import { AnalyticsPipelinesI18nKey, BackfillI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import {
  PipelineBackfillPauseReason,
  PipelineBackfillRun,
  PipelineBackfillState,
} from '@/src/models/analytics/pipeline-backfill';

vi.mock('@/src/app/[lang]/pipelines/actions');

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

const NAME = 'usage-live';

const makeRun = (overrides: Partial<PipelineBackfillRun> = {}): PipelineBackfillRun => ({
  id: 'run-1',
  pipeline_name: NAME,
  kind: 'backfill',
  state: PipelineBackfillState.Done,
  rows_done: 48120,
  window_from: '2026-09-13T23:59:59.999Z',
  window_to: '2026-09-21T23:59:59.999Z',
  started_at: '2026-09-24T10:00:00Z',
  finished_at: '2026-09-24T11:00:00Z',
  ...overrides,
});

const serve = (runs: PipelineBackfillRun[]) =>
  vi.mocked(listPipelineBackfills).mockResolvedValue({ success: true, response: runs });

interface Options {
  isGroupTrigger?: boolean;
  isPipelinePaused?: boolean;
}

const renderSidebar = async (
  runs: PipelineBackfillRun[],
  { isGroupTrigger = false, isPipelinePaused = false }: Options = {},
) => {
  serve(runs);
  const props = { onRunsChange: vi.fn() };
  const view = render(
    <PipelineBackfillSidebar
      pipelineName={NAME}
      isGroupTrigger={isGroupTrigger}
      isPipelinePaused={isPipelinePaused}
      {...props}
    />,
  );

  // A run section renders once the runs arrive; an empty answer renders nothing new, so it is flushed instead.
  if (runs.length > 0) {
    await screen.findByRole('region', { name: BackfillI18nKey.SectionRun });
  } else {
    await vi.waitFor(() => expect(props.onRunsChange).toHaveBeenCalled());
    await act(async () => {});
  }

  return { ...view, ...props };
};

const setRange = (from: string, to: string) => {
  fireEvent.change(screen.getByLabelText(BackfillI18nKey.FieldFrom), { target: { value: from } });
  fireEvent.change(screen.getByLabelText(BackfillI18nKey.FieldTo), { target: { value: to } });
};

const startButton = () => screen.getByRole('button', { name: BackfillI18nKey.Start });

describe('PipelineBackfillSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPipelineFailures).mockResolvedValue({
      success: true,
      response: { items: [], has_more: false, total: 0, requeueable_total: 0 },
    });
  });

  describe('which run is presented', () => {
    test('asks for the pipeline’s ten latest runs', async () => {
      await renderSidebar([]);

      expect(listPipelineBackfills).toHaveBeenCalledWith(NAME, 10);
    });

    test('presents a running run, offers Pause and Cancel, and withholds the start form', async () => {
      await renderSidebar([makeRun({ state: PipelineBackfillState.Running })]);

      expect(screen.getByRole('button', { name: BackfillI18nKey.Pause })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: BackfillI18nKey.Cancel })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Resume })).toBeNull();
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Start })).toBeNull();
    });

    test('presents a paused run with its reason, offers Resume and Cancel, and withholds the start form', async () => {
      await renderSidebar([
        makeRun({
          state: PipelineBackfillState.Paused,
          paused_reason: PipelineBackfillPauseReason.SpendBudgetExhausted,
          paused_at: '2026-09-24T10:30:00Z',
        }),
      ]);

      expect(screen.getByText(new RegExp(BackfillI18nKey.PauseReasonSpendBudgetExhausted))).toBeInTheDocument();
      expect(screen.getByRole('button', { name: BackfillI18nKey.Resume })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: BackfillI18nKey.Cancel })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Pause })).toBeNull();
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Start })).toBeNull();
    });

    test('tells the reader a cancelled run is how a paused one makes way for a new start', async () => {
      await renderSidebar([makeRun({ state: PipelineBackfillState.Paused })]);

      expect(screen.getByText(BackfillI18nKey.OnlyOneRunHint)).toBeInTheDocument();
    });

    test('presents the latest run and offers the start form when none is running or paused', async () => {
      await renderSidebar([makeRun({ id: 'run-2' }), makeRun()]);

      expect(screen.getByRole('button', { name: BackfillI18nKey.Start })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Pause })).toBeNull();
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Resume })).toBeNull();
    });

    test('offers a finished run no control of its own', async () => {
      await renderSidebar([makeRun({ state: PipelineBackfillState.Cancelled })]);

      expect(screen.queryByRole('button', { name: BackfillI18nKey.Pause })).toBeNull();
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Resume })).toBeNull();
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Cancel })).toBeNull();
    });

    test('offers the start form alone, with no list section, when the pipeline has no run', async () => {
      await renderSidebar([]);

      expect(startButton()).toBeInTheDocument();
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

    test('drops the form block while a run holds the pipeline', async () => {
      await renderSidebar([makeRun({ state: PipelineBackfillState.Running })]);

      expect(screen.queryByRole('region', { name: BackfillI18nKey.SectionStart })).toBeNull();
    });

    test('presents the run the reader chooses from the list', async () => {
      const user = userEvent.setup();
      await renderSidebar([makeRun({ id: 'run-2', window_from: null, window_to: null }), makeRun({ id: 'run-1' })]);

      await user.click(screen.getByRole('button', { name: new RegExp(BackfillI18nKey.WindowRange) }));

      expect(screen.getByRole('button', { name: new RegExp(BackfillI18nKey.WindowRange) })).toHaveAttribute(
        'aria-current',
        'true',
      );
    });

    test('gives the run id a copy control', async () => {
      await renderSidebar([makeRun()]);

      expect(screen.getByText('run-1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: `copy ${BackfillI18nKey.RunId}` })).toBeInTheDocument();
    });

    test('links to nothing in the failed rows tab', async () => {
      await renderSidebar([makeRun()]);

      expect(screen.queryByRole('link')).toBeNull();
    });
  });

  describe('the list', () => {
    test('says only the latest runs are shown when the service returned as many as were asked for', async () => {
      await renderSidebar(Array.from({ length: 10 }, (_, i) => makeRun({ id: `run-${i}` })));

      expect(screen.getByText(BackfillI18nKey.RunsLatestOnly)).toBeInTheDocument();
    });

    test('says nothing of the kind for a shorter list', async () => {
      await renderSidebar([makeRun(), makeRun({ id: 'run-2' })]);

      expect(screen.queryByText(BackfillI18nKey.RunsLatestOnly)).toBeNull();
    });
  });

  describe('how a run reads', () => {
    test('reads its window as days', async () => {
      await renderSidebar([makeRun()]);

      expect(screen.getAllByText(BackfillI18nKey.WindowRange).length).toBeGreaterThan(0);
    });

    test('reads a full replay as Everything', async () => {
      await renderSidebar([makeRun({ window_from: null, window_to: null })]);

      const presented = screen.getByText(BackfillI18nKey.Window).closest('div') as HTMLElement;

      expect(within(presented).getByText(BackfillI18nKey.Everything)).toBeInTheDocument();
    });

    test('states rows done and no percentage', async () => {
      await renderSidebar([makeRun({ state: PipelineBackfillState.Running })]);

      expect(screen.getByText(BackfillI18nKey.RowsDone)).toBeInTheDocument();
      expect(screen.queryByText(/%/)).toBeNull();
    });

    test('states the classified error and that the run is retrying', async () => {
      await renderSidebar([
        makeRun({
          state: PipelineBackfillState.Running,
          last_error: 'ADAS 422 unaccounted_page',
          last_error_at: '2026-09-24T10:20:00Z',
        }),
      ]);

      const retrying = screen.getByText(new RegExp(BackfillI18nKey.Retrying));

      expect(retrying).toHaveAttribute('role', 'status');
      expect(retrying).toHaveTextContent('ADAS 422 unaccounted_page');
    });

    test('shows no retrying line for a run whose last batch committed', async () => {
      await renderSidebar([makeRun({ state: PipelineBackfillState.Running })]);

      expect(screen.queryByText(new RegExp(BackfillI18nKey.Retrying))).toBeNull();
    });

    test('reads a finished run of a group pipeline as Queued, with its explanation', async () => {
      await renderSidebar([makeRun()], { isGroupTrigger: true });

      expect(screen.getAllByText(BackfillI18nKey.StatusQueued).length).toBeGreaterThan(0);
      expect(screen.getByText(BackfillI18nKey.StatusQueuedHint)).toBeInTheDocument();
      expect(screen.queryByText(BackfillI18nKey.StatusDone)).toBeNull();
    });

    test('reads a finished run of any other pipeline as Done', async () => {
      await renderSidebar([makeRun()], { isGroupTrigger: false });

      expect(screen.getAllByText(BackfillI18nKey.StatusDone).length).toBeGreaterThan(0);
      expect(screen.queryByText(BackfillI18nKey.StatusQueued)).toBeNull();
    });

    test('shows a moment set outside the console as the moment it is, not as a day', async () => {
      await renderSidebar([
        makeRun({ window_from: '2026-09-14T08:30:00.000Z', window_to: '2026-09-21T23:59:59.999Z' }),
      ]);

      expect(screen.queryAllByText(BackfillI18nKey.WindowRange).length).toBeGreaterThan(0);
      expect(screen.queryByText('2026-09-14')).toBeNull();
    });
  });

  describe('the controls', () => {
    test('pauses a running run and reads the runs again', async () => {
      const user = userEvent.setup();
      vi.mocked(pausePipelineBackfill).mockResolvedValue({ success: true });
      await renderSidebar([makeRun({ state: PipelineBackfillState.Running })]);
      vi.mocked(listPipelineBackfills).mockClear();

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Pause }));

      expect(pausePipelineBackfill).toHaveBeenCalledWith('run-1');
      await vi.waitFor(() => expect(listPipelineBackfills).toHaveBeenCalled());
    });

    test('resumes a paused run without asking for confirmation', async () => {
      const user = userEvent.setup();
      vi.mocked(resumePipelineBackfill).mockResolvedValue({ success: true });
      await renderSidebar([makeRun({ state: PipelineBackfillState.Paused })]);

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Resume }));

      expect(resumePipelineBackfill).toHaveBeenCalledWith('run-1');
    });

    test('does not warn before resuming a run paused for a stalled cursor, or block a run paused with its pipeline', async () => {
      const user = userEvent.setup();
      vi.mocked(resumePipelineBackfill).mockResolvedValue({ success: true });
      await renderSidebar([
        makeRun({ state: PipelineBackfillState.Paused, paused_reason: PipelineBackfillPauseReason.CursorStalled }),
      ]);

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Resume }));

      expect(resumePipelineBackfill).toHaveBeenCalledOnce();
      expect(screen.queryByText(BackfillI18nKey.CancelConfirmTitle)).toBeNull();
    });

    test('withholds Resume while the pipeline is paused, says why, and leaves Cancel', async () => {
      await renderSidebar(
        [
          makeRun({
            state: PipelineBackfillState.Paused,
            paused_reason: PipelineBackfillPauseReason.PipelinePausedOperator,
          }),
        ],
        { isPipelinePaused: true },
      );

      expect(screen.queryByRole('button', { name: BackfillI18nKey.Resume })).toBeNull();
      expect(screen.getByText(BackfillI18nKey.ResumeBlockedByPipeline)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: BackfillI18nKey.Cancel })).toBeEnabled();
    });

    test('withholds Resume from a run paused for its own reason too, while the pipeline is paused', async () => {
      await renderSidebar(
        [makeRun({ state: PipelineBackfillState.Paused, paused_reason: PipelineBackfillPauseReason.Operator })],
        { isPipelinePaused: true },
      );

      expect(screen.queryByRole('button', { name: BackfillI18nKey.Resume })).toBeNull();
    });

    test('offers Resume again once the pipeline is resumed while the sidebar is open', async () => {
      const paused = makeRun({
        state: PipelineBackfillState.Paused,
        paused_reason: PipelineBackfillPauseReason.Operator,
      });
      const { rerender, onRunsChange } = await renderSidebar([paused], { isPipelinePaused: true });

      expect(screen.queryByRole('button', { name: BackfillI18nKey.Resume })).toBeNull();

      rerender(
        <PipelineBackfillSidebar
          pipelineName={NAME}
          isGroupTrigger={false}
          isPipelinePaused={false}
          onRunsChange={onRunsChange}
        />,
      );

      expect(screen.getByRole('button', { name: BackfillI18nKey.Resume })).toBeEnabled();
      expect(screen.queryByText(BackfillI18nKey.ResumeBlockedByPipeline)).toBeNull();
    });

    test('shows the service’s message when a resume is refused for a reason the console cannot see', async () => {
      const user = userEvent.setup();
      vi.mocked(resumePipelineBackfill).mockResolvedValue({
        success: false,
        status: 409,
        errorHeader: 'backfill_conflict',
        errorMessage: 'Pipeline is over its daily spend budget',
      });
      await renderSidebar([
        makeRun({
          state: PipelineBackfillState.Paused,
          paused_reason: PipelineBackfillPauseReason.SpendBudgetExhausted,
        }),
      ]);

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Resume }));

      await vi.waitFor(() =>
        expect(showNotification).toHaveBeenCalledWith(
          expect.objectContaining({ description: 'Pipeline is over its daily spend budget' }),
        ),
      );
    });

    test('lists the run’s facts in the order a reader reaches for them: id, window, rows and dead letters, then times', async () => {
      await renderSidebar([makeRun()]);

      const labels = within(screen.getByRole('region', { name: BackfillI18nKey.SectionRun }))
        .getAllByRole('term')
        .map((term) => term.textContent);

      expect(labels).toEqual([
        BackfillI18nKey.RunId,
        BackfillI18nKey.Window,
        BackfillI18nKey.RowsDone,
        BackfillI18nKey.DeadLetters,
        BackfillI18nKey.StartedAt,
        BackfillI18nKey.FinishedAt,
      ]);
    });

    test('shows rows done and dead letters in one row, with dead letters red when there are some', async () => {
      vi.mocked(getPipelineFailures).mockResolvedValue({
        success: true,
        response: { items: [], has_more: false, total: 3, requeueable_total: 0 },
      });
      await renderSidebar([makeRun()]);

      const run = screen.getByRole('region', { name: BackfillI18nKey.SectionRun });
      const row = within(run).getByText(BackfillI18nKey.RowsDone).closest('dl') as HTMLElement;

      expect(
        within(row)
          .getAllByRole('term')
          .map((term) => term.textContent),
      ).toEqual([BackfillI18nKey.RowsDone, BackfillI18nKey.DeadLetters]);
      const deadLetters = (
        within(row).getByText(BackfillI18nKey.DeadLetters).closest('div') as HTMLElement
      ).querySelector('dd') as HTMLElement;
      expect(await within(deadLetters).findByText('3')).toBeInTheDocument();
      expect(deadLetters).toHaveClass('text-error');
    });

    test('puts the run’s controls first in its block', async () => {
      await renderSidebar([makeRun({ state: PipelineBackfillState.Running })]);

      const buttons = within(screen.getByRole('region', { name: BackfillI18nKey.SectionRun })).getAllByRole('button');

      expect(buttons[0]).toHaveAccessibleName(BackfillI18nKey.Pause);
      expect(buttons[1]).toHaveAccessibleName(BackfillI18nKey.Cancel);
    });

    test('asks for confirmation before cancelling and cancels nothing until it is given', async () => {
      const user = userEvent.setup();
      vi.mocked(cancelPipelineBackfill).mockResolvedValue({ success: true });
      await renderSidebar([makeRun({ state: PipelineBackfillState.Running })]);

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Cancel }));

      expect(screen.getByText(BackfillI18nKey.CancelConfirmTitle)).toBeInTheDocument();
      expect(cancelPipelineBackfill).not.toHaveBeenCalled();
    });

    test('cancels once the confirmation is given', async () => {
      const user = userEvent.setup();
      vi.mocked(cancelPipelineBackfill).mockResolvedValue({ success: true });
      await renderSidebar([makeRun({ state: PipelineBackfillState.Running })]);

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Cancel }));
      const confirm = screen.getAllByRole('button', { name: BackfillI18nKey.Cancel }).at(-1) as HTMLElement;
      await user.click(confirm);

      expect(cancelPipelineBackfill).toHaveBeenCalledWith('run-1');
    });

    test('leaves the run alone when the confirmation is declined', async () => {
      const user = userEvent.setup();
      await renderSidebar([makeRun({ state: PipelineBackfillState.Running })]);

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Cancel }));
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

      expect(cancelPipelineBackfill).not.toHaveBeenCalled();
      expect(screen.queryByText(BackfillI18nKey.CancelConfirmTitle)).toBeNull();
    });

    test('shows the service’s message for a run that changed state and reads it again', async () => {
      const user = userEvent.setup();
      vi.mocked(pausePipelineBackfill).mockResolvedValue({
        success: false,
        status: 409,
        errorHeader: 'conflict',
        errorMessage: 'run is already done',
      });
      await renderSidebar([makeRun({ state: PipelineBackfillState.Running })]);
      vi.mocked(listPipelineBackfills).mockClear();

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Pause }));

      await vi.waitFor(() =>
        expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ description: 'run is already done' })),
      );
      await vi.waitFor(() => expect(listPipelineBackfills).toHaveBeenCalled());
    });
  });

  describe('the start form', () => {
    test('keeps Start off until the range is chosen', async () => {
      await renderSidebar([]);

      expect(startButton()).toBeDisabled();
    });

    test('sends whole days as the two moments the runner counts from', async () => {
      const user = userEvent.setup();
      vi.mocked(startPipelineBackfill).mockResolvedValue({ success: true });
      await renderSidebar([]);
      setRange('2026-09-14', '2026-09-21');

      await user.click(startButton());

      expect(startPipelineBackfill).toHaveBeenCalledWith(NAME, {
        from: '2026-09-13T23:59:59.999Z',
        to: '2026-09-21T23:59:59.999Z',
      });
    });

    test('offers no way to start a replay of the whole history', async () => {
      await renderSidebar([]);

      expect(screen.queryByRole('checkbox')).toBeNull();
      expect(startButton()).toBeDisabled();
    });

    test('disables Start and says why for an inverted range', async () => {
      await renderSidebar([]);

      setRange('2026-09-21', '2026-09-14');

      expect(startButton()).toBeDisabled();
      expect(screen.getByRole('alert')).toHaveTextContent(BackfillI18nKey.RangeIssueInverted);
    });

    test('disables Start and says why for a last date after today in UTC', async () => {
      await renderSidebar([]);

      setRange('2026-09-14', '2999-01-01');

      expect(startButton()).toBeDisabled();
      expect(screen.getByRole('alert')).toHaveTextContent(BackfillI18nKey.RangeIssueInFuture);
    });

    test('sets no span limit: the runner’s window has none', async () => {
      await renderSidebar([]);

      setRange('2000-01-01', '2026-09-01');

      expect(startButton()).toBeEnabled();
    });

    test('reads the runs again once the runner accepts', async () => {
      const user = userEvent.setup();
      vi.mocked(startPipelineBackfill).mockResolvedValue({ success: true });
      await renderSidebar([]);
      setRange('2026-09-14', '2026-09-21');
      vi.mocked(listPipelineBackfills).mockClear();

      await user.click(startButton());

      await vi.waitFor(() => expect(listPipelineBackfills).toHaveBeenCalled());
    });

    test.each([
      ['a pipeline that is paused', 'Pipeline is paused'],
      ['a pipeline the runner does not hold', 'Pipeline not found or not enabled'],
      ['a runner whose list has not loaded', 'The pipeline list has not loaded yet'],
    ])('shows the runner’s own message for %s and leaves the form as it was', async (_case, message) => {
      const user = userEvent.setup();
      vi.mocked(startPipelineBackfill).mockResolvedValue({
        success: false,
        errorHeader: 'refused',
        errorMessage: message,
      });
      await renderSidebar([]);
      setRange('2026-09-14', '2026-09-21');

      await user.click(startButton());

      await vi.waitFor(() =>
        expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ description: message })),
      );
      await waitFor(() => expect(startButton()).toBeEnabled());
      expect(screen.getByLabelText(BackfillI18nKey.FieldFrom)).toHaveValue('2026-09-14');
      expect(startButton()).toBeEnabled();
    });

    test('never presents a start on a paused pipeline as accepted', async () => {
      const user = userEvent.setup();
      vi.mocked(startPipelineBackfill).mockResolvedValue({
        success: false,
        errorHeader: 'backfill_conflict',
        errorMessage: 'Its pipeline is paused',
      });
      await renderSidebar([], { isPipelinePaused: true });
      setRange('2026-09-14', '2026-09-21');

      await user.click(startButton());

      await vi.waitFor(() => expect(showNotification).toHaveBeenCalled());
      expect(showNotification).not.toHaveBeenCalledWith(expect.objectContaining({ title: BackfillI18nKey.Started }));
    });
  });

  describe('dead letters and requeue', () => {
    const withDeadLetters = (total: number, requeueable: number) =>
      vi.mocked(getPipelineFailures).mockResolvedValue({
        success: true,
        response: { items: [], has_more: false, total, requeueable_total: requeueable },
      });

    test('counts the run’s dead letters through the listing narrowed to the run', async () => {
      withDeadLetters(12, 10);
      await renderSidebar([makeRun()]);

      expect(await screen.findByText('12')).toBeInTheDocument();
      expect(getPipelineFailures).toHaveBeenCalledWith(NAME, { runId: 'run-1' }, 1);
    });

    test('offers to requeue the run’s failed rows with their count', async () => {
      withDeadLetters(12, 10);
      await renderSidebar([makeRun()]);

      expect(await screen.findByRole('button', { name: BackfillI18nKey.Requeue })).toBeInTheDocument();
    });

    test('requeues only that run’s rows and reports how many the service re-ran', async () => {
      const user = userEvent.setup();
      withDeadLetters(12, 10);
      vi.mocked(requeueFailures).mockResolvedValue({ success: true, response: { requeued: 9 } });
      await renderSidebar([makeRun()]);

      await user.click(await screen.findByRole('button', { name: BackfillI18nKey.Requeue }));

      expect(requeueFailures).not.toHaveBeenCalled();

      await user.click(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetry }));

      expect(requeueFailures).toHaveBeenCalledWith(NAME, 'run-1');
      expect(await screen.findByText(new RegExp(AnalyticsPipelinesI18nKey.FailuresRequeued))).toBeInTheDocument();
    });

    test('does not requeue when the confirmation is dismissed', async () => {
      const user = userEvent.setup();
      withDeadLetters(12, 10);
      await renderSidebar([makeRun()]);

      await user.click(await screen.findByRole('button', { name: BackfillI18nKey.Requeue }));
      await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Cancel }));

      expect(requeueFailures).not.toHaveBeenCalled();
    });

    test('offers no requeue for a run with no dead letters', async () => {
      withDeadLetters(0, 0);
      await renderSidebar([makeRun()]);

      // The count replaces the '—' placeholder only once the listing has been processed.
      expect(await screen.findByText('0')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Requeue })).toBeNull();
    });

    test('offers no requeue when none of the dead letters can be re-run', async () => {
      withDeadLetters(5, 0);
      await renderSidebar([makeRun()]);

      // The count replaces the '—' placeholder only once the listing has been processed.
      expect(await screen.findByText('5')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: BackfillI18nKey.Requeue })).toBeNull();
    });

    test('never offers a new run over the same window as a way to repeat a finished one', async () => {
      withDeadLetters(12, 10);
      await renderSidebar([makeRun()]);

      expect(screen.queryByRole('button', { name: /re-?run|repeat/i })).toBeNull();
    });
  });

  test('hands every answer to the banner’s owner', async () => {
    const { onRunsChange } = await renderSidebar([makeRun()]);

    expect(onRunsChange).toHaveBeenCalledWith([expect.objectContaining({ id: 'run-1' })]);
  });
});
