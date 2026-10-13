import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getPipelineFailures,
  getPipelineRuntimeView,
  getTable,
  getTables,
  listPipelineBackfills,
  startPipelineBackfill,
} from '@/src/app/[lang]/pipelines/actions';
import { runtimeView } from '@/src/components/Analytics/Pipelines/Common/tests/mock';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import { BackfillI18nKey, ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Pipeline, PipelineKind, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
import {
  PipelineBackfillPauseReason,
  PipelineBackfillRun,
  PipelineBackfillState,
} from '@/src/models/analytics/pipeline-backfill';
import {
  PauseOrigin,
  PipelineRuntimeState,
  RUNNER_NOT_CONFIGURED,
  RUNNER_PIPELINE_NOT_FOUND,
} from '@/src/models/analytics/pipeline-runtime';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/pipelines/actions');
const backfillSidebar = vi.hoisted(() => ({ showSidebar: vi.fn(), closeSidebar: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: vi.fn(), removeNotification: vi.fn() }),
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({
    featureFlags: { analyticsEnabled: true },
    isFullAdmin: true,
    sidebar: backfillSidebar,
  })),
}));

const asFullAdmin = (isFullAdmin: boolean) =>
  vi.mocked(useAppContext).mockReturnValue({
    featureFlags: { analyticsEnabled: true },
    isFullAdmin,
    sidebar: backfillSidebar,
  } as never);

const enrichment: AnalyticsTable = {
  name: 'turn_feedback',
  type: AnalyticsTableType.Enrichment,
  source_table: 'dial_usage_log',
  grain: { grain_key: 'response_id' },
  columns: [{ source_name: 'rate_event_count', name: 'rate_event_count', type: AnalyticsFieldType.Long }],
};

const sourceTable: AnalyticsTable = { name: 'dial_usage_log', type: AnalyticsTableType.Source, columns: [] };

const pipeline: Pipeline = {
  name: 'feedback-live',
  kind: PipelineKind.Enrich,
  transform: { type: TransformType.Sql, outputs: { rate_event_count: 'count(*)' } },
  target: 'turn_feedback',
  trigger: { kind: TriggerKind.Schedule },
  enabled: true,
  grain_key: 'response_id',
  version_column: 'ingested_at',
  generation: 7,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  state: { last_run_at: '2026-09-21T16:12:08Z', lag_seconds: 38 },
};

const run = (overrides: Partial<PipelineBackfillRun> = {}): PipelineBackfillRun => ({
  id: 'run-1',
  pipeline_name: 'feedback-live',
  kind: 'backfill',
  state: PipelineBackfillState.Done,
  rows_done: 100,
  started_at: '2026-09-24T10:00:00Z',
  ...overrides,
});

const serve = (...runs: PipelineBackfillRun[]) =>
  vi.mocked(listPipelineBackfills).mockResolvedValue({ success: true, response: runs });

const renderView = () => render(<PipelineDetailView pipeline={pipeline} takenTargets={['turn_feedback']} />);

const backfillButton = () => screen.queryByRole('button', { name: BackfillI18nKey.Title });

describe('PipelineDetailView — backfill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asFullAdmin(true);
    vi.mocked(getTables).mockResolvedValue([enrichment, sourceTable]);
    vi.mocked(getTable).mockImplementation(
      async (name) => [enrichment, sourceTable].find((table) => table.name === name) ?? null,
    );
    vi.mocked(getPipelineRuntimeView).mockResolvedValue({
      success: true,
      response: runtimeView({ pipeline_name: 'feedback-live' }),
    });
    vi.mocked(getPipelineFailures).mockResolvedValue({
      success: true,
      response: { items: [], has_more: false, total: 0, requeueable_total: 0 },
    });
    serve();
  });

  describe('the header button', () => {
    test('is offered to a full admin once the runner has answered', async () => {
      renderView();

      expect(await screen.findByRole('button', { name: BackfillI18nKey.Title })).toBeInTheDocument();
    });

    test('is offered on every tab, not only on Runtime', async () => {
      const user = userEvent.setup();
      renderView();
      await screen.findByRole('button', { name: BackfillI18nKey.Title });

      await user.click(screen.getByText(TabsI18nKey.Audit));
      expect(backfillButton()).toBeInTheDocument();

      await user.click(screen.getByText(TabsI18nKey.Runtime));
      expect(backfillButton()).toBeInTheDocument();
    });

    test('is withheld from a caller who is not a full admin, with nothing read for it', async () => {
      asFullAdmin(false);
      renderView();

      await screen.findByText(TabsI18nKey.Audit);

      expect(backfillButton()).toBeNull();
      expect(listPipelineBackfills).not.toHaveBeenCalled();
    });

    test('is withheld when no runner host is configured', async () => {
      vi.mocked(getPipelineRuntimeView).mockResolvedValue({ success: false, errorHeader: RUNNER_NOT_CONFIGURED });
      renderView();

      await waitFor(() => expect(getPipelineRuntimeView).toHaveBeenCalled());
      await screen.findByText(TabsI18nKey.Runtime);

      expect(backfillButton()).toBeNull();
      expect(listPipelineBackfills).not.toHaveBeenCalled();
    });

    test('is still offered for a pipeline the runner does not hold, so its refusal can be read', async () => {
      vi.mocked(getPipelineRuntimeView).mockResolvedValue({ success: false, errorHeader: RUNNER_PIPELINE_NOT_FOUND });
      renderView();

      expect(await screen.findByRole('button', { name: BackfillI18nKey.Title })).toBeInTheDocument();
    });

    test('opens the backfill drawer and starts nothing', async () => {
      const user = userEvent.setup();
      renderView();

      await user.click(await screen.findByRole('button', { name: BackfillI18nKey.Title }));

      expect(await screen.findByRole('dialog', { name: BackfillI18nKey.Title })).toBeInTheDocument();
      expect(startPipelineBackfill).not.toHaveBeenCalled();
    });

    test('is closed until it is asked for', async () => {
      renderView();

      await screen.findByRole('button', { name: BackfillI18nKey.Title });

      expect(screen.queryByRole('dialog', { name: BackfillI18nKey.Title })).toBeNull();
    });

    test('closes the drawer through its close control and when the page around it is pressed', async () => {
      const user = userEvent.setup();
      renderView();
      await user.click(await screen.findByRole('button', { name: BackfillI18nKey.Title }));

      await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Close }));
      expect(screen.queryByRole('dialog', { name: BackfillI18nKey.Title })).toBeNull();

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.Title }));
      fireEvent.mouseDown(
        (await screen.findByRole('dialog', { name: BackfillI18nKey.Title })).parentElement as HTMLElement,
      );
      expect(screen.queryByRole('dialog', { name: BackfillI18nKey.Title })).toBeNull();
    });

    test('withholds Resume in the drawer while the pipeline is paused, read from the runtime the page already holds', async () => {
      const user = userEvent.setup();
      vi.mocked(getPipelineRuntimeView).mockResolvedValue({
        success: true,
        response: runtimeView({
          pipeline_name: 'feedback-live',
          status: {
            state: PipelineRuntimeState.Paused,
            origin: PauseOrigin.Operator,
            reason: 'paused by an operator',
            since: '2026-09-21T15:40:00Z',
          },
        }),
      });
      serve(
        run({
          state: PipelineBackfillState.Paused,
          paused_reason: PipelineBackfillPauseReason.PipelinePausedOperator,
        }),
      );
      renderView();

      await user.click(await screen.findByRole('button', { name: BackfillI18nKey.Title }));
      const drawer = await screen.findByRole('dialog', { name: BackfillI18nKey.Title });

      expect(await within(drawer).findByText(BackfillI18nKey.ResumeBlockedByPipeline)).toBeInTheDocument();
      expect(within(drawer).queryByRole('button', { name: BackfillI18nKey.Resume })).toBeNull();
      expect(within(drawer).getByRole('button', { name: BackfillI18nKey.Cancel })).toBeEnabled();
    });
  });

  describe('the banner above the tab strip', () => {
    test('states a running backfill and opens the drawer', async () => {
      const user = userEvent.setup();
      serve(run({ state: PipelineBackfillState.Running }));
      renderView();

      expect(await screen.findByText(BackfillI18nKey.BannerRunning)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: BackfillI18nKey.ViewRun }));

      expect(await screen.findByRole('dialog', { name: BackfillI18nKey.Title })).toBeInTheDocument();
    });

    test('states a paused backfill with the reason the run reports', async () => {
      serve(
        run({
          state: PipelineBackfillState.Paused,
          paused_reason: PipelineBackfillPauseReason.SpendBudgetExhausted,
        }),
      );
      renderView();

      expect(await screen.findByText(BackfillI18nKey.BannerPaused)).toBeInTheDocument();
      expect(screen.getByText(BackfillI18nKey.PauseReasonSpendBudgetExhausted)).toBeInTheDocument();
    });

    test.each([PipelineBackfillPauseReason.PipelinePausedOperator, PipelineBackfillPauseReason.PipelinePausedBreaker])(
      'leaves a run paused with its pipeline (%s) to the pipeline’s own banner',
      async (reason) => {
        serve(run({ state: PipelineBackfillState.Paused, paused_reason: reason }));
        renderView();

        await waitFor(() => expect(listPipelineBackfills).toHaveBeenCalled());
        await screen.findByRole('button', { name: BackfillI18nKey.Title });

        expect(screen.queryByText(BackfillI18nKey.BannerPaused)).toBeNull();
        expect(screen.queryByText(BackfillI18nKey.BannerRunning)).toBeNull();
      },
    );

    test.each([PipelineBackfillState.Done, PipelineBackfillState.Cancelled])(
      'shows nothing for a %s run',
      async (state) => {
        serve(run({ state }));
        renderView();

        await waitFor(() => expect(listPipelineBackfills).toHaveBeenCalled());
        await screen.findByRole('button', { name: BackfillI18nKey.Title });

        expect(screen.queryByText(BackfillI18nKey.BannerRunning)).toBeNull();
        expect(screen.queryByText(BackfillI18nKey.BannerPaused)).toBeNull();
      },
    );

    test('is read for the pipeline by its name, so a reload finds the run without its id', async () => {
      renderView();

      await waitFor(() => expect(listPipelineBackfills).toHaveBeenCalledWith('feedback-live', 10));
    });

    test('shows nothing to a caller who is not a full admin even when a run is running', async () => {
      asFullAdmin(false);
      serve(run({ state: PipelineBackfillState.Running }));
      renderView();

      await screen.findByText(TabsI18nKey.Audit);

      expect(screen.queryByText(BackfillI18nKey.BannerRunning)).toBeNull();
    });
  });
});
