import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getPausedPipelines,
  getRunnerPipelines,
  getTable,
  getTables,
  pausePipeline,
  resumePipeline,
} from '@/src/app/[lang]/pipelines/actions';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import { AnalyticsPipelinesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Pipeline, PipelineKind, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
import { PausedPipeline, PauseOrigin } from '@/src/models/analytics/pipeline-runtime';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/pipelines/actions');

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

// Every runtime affordance turns on full-admin rights, so the context is a spy here rather than the
// shared frozen value.
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({ featureFlags: { analyticsEnabled: true }, isFullAdmin: true })),
}));

const asFullAdmin = (isFullAdmin: boolean) =>
  vi.mocked(useAppContext).mockReturnValue({
    featureFlags: { analyticsEnabled: true },
    isFullAdmin,
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
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  grain_key: 'response_id',
  version_column: 'ingested_at',
  generation: 7,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  state: { last_run_at: '2026-09-21T16:12:08Z', lag_seconds: 38 },
};

const OPERATOR_PAUSE: PausedPipeline = {
  pipelineName: 'feedback-live',
  origin: PauseOrigin.Operator,
  reason: 'paused by an operator',
  since: '2026-09-21T15:40:00Z',
};

const asPaused = (...paused: PausedPipeline[]) =>
  vi.mocked(getPausedPipelines).mockResolvedValue({ success: true, response: paused });

/** The runner has taken these on; the frame states `running` only for a name in this set. */
const asTracked = (...pipelineNames: string[]) =>
  vi.mocked(getRunnerPipelines).mockResolvedValue({
    success: true,
    response: pipelineNames.map((name) => ({ name, enabled: true, generation: 7 })),
  });

/** The control lives in the Runtime tab's bar; the banner carries a second Resume while paused. */
const tabControl = (name: string) => screen.getAllByRole('button', { name }).at(-1) as HTMLElement;

const openRuntime = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(await screen.findByText(TabsI18nKey.Runtime));

const renderView = (override?: Partial<Pipeline>) =>
  render(<PipelineDetailView pipeline={{ ...pipeline, ...override }} takenTargets={['turn_feedback']} />);

describe('PipelineDetailView — runtime and pause', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asFullAdmin(true);
    vi.mocked(getTables).mockResolvedValue([enrichment, sourceTable]);
    vi.mocked(getTable).mockImplementation(
      async (name) => [enrichment, sourceTable].find((table) => table.name === name) ?? null,
    );
    asPaused();
    asTracked('feedback-live');
    vi.mocked(pausePipeline).mockResolvedValue({ success: true });
    vi.mocked(resumePipeline).mockResolvedValue({ success: true });
  });

  test('offers a Runtime tab between Properties and Audit', async () => {
    renderView();

    expect(await screen.findByText(TabsI18nKey.Runtime)).toBeTruthy();
  });

  test('withholds the Runtime tab from a caller who is not a full admin', async () => {
    asFullAdmin(false);
    renderView();

    expect(await screen.findByText(TabsI18nKey.Audit)).toBeTruthy();
    expect(screen.queryByText(TabsI18nKey.Runtime)).toBeNull();
    expect(getPausedPipelines).not.toHaveBeenCalled();
    expect(getRunnerPipelines).not.toHaveBeenCalled();
  });

  test('states a running pipeline as both enabled and running', async () => {
    renderView();

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.RuntimeRunning)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.StatusEnabled)).toBeTruthy();
  });

  // Pausing leaves the declaration untouched, so a paused pipeline that read as disabled would send an
  // operator to re-enable something nobody disabled.
  test('states a paused pipeline as paused and still enabled', async () => {
    asPaused(OPERATOR_PAUSE);
    renderView();

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.RuntimePaused)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.StatusEnabled)).toBeTruthy();
  });

  test('states no runtime status for a disabled pipeline', async () => {
    renderView({ enabled: false });

    await waitFor(() => expect(getPausedPipelines).toHaveBeenCalled());
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeRunning)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimePaused)).toBeNull();
  });

  // The registry presents it as healthy while nothing drives it, so a chip alone will not do.
  test('warns when the runner has not taken the pipeline on', async () => {
    asTracked('something-else');
    renderView();

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.RuntimeNotTrackedTitle)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimeNotTracked)).toBeTruthy();
  });

  test('offers no pause for a pipeline nothing is running', async () => {
    const user = userEvent.setup();
    asTracked('something-else');
    renderView();

    await user.click(await screen.findByText(TabsI18nKey.Runtime));

    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.Pause })).toBeNull();
  });

  // ADAS drives aggregate pipelines on its own scheduler; the runner's cache says nothing about them.
  test('states no runtime status for an aggregate pipeline', async () => {
    asTracked('something-else');
    renderView({ kind: PipelineKind.Aggregate, transform: undefined });

    await waitFor(() => expect(getRunnerPipelines).toHaveBeenCalled());
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeNotTrackedTitle)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeRunning)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeNotTracked)).toBeNull();
  });

  test('states no runtime status when the runner did not answer', async () => {
    vi.mocked(getPausedPipelines).mockResolvedValue({ success: false });
    renderView();

    await waitFor(() => expect(getPausedPipelines).toHaveBeenCalled());
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeRunning)).toBeNull();
  });

  test('raises a pause banner that names no author and offers to resume', async () => {
    asPaused(OPERATOR_PAUSE);
    renderView();

    const banner = await screen.findByRole('status');

    expect(banner.textContent).toContain(AnalyticsPipelinesI18nKey.PausedBannerTitle);
    expect(banner.textContent).toContain(AnalyticsPipelinesI18nKey.PausedBanner);
    expect(within(banner).getByRole('button', { name: AnalyticsPipelinesI18nKey.Resume })).toBeTruthy();
    expect(screen.queryByText(/operator|admin@/i)).toBeNull();
  });

  test('states when a breaker pause lifts itself', async () => {
    asPaused({ ...OPERATOR_PAUSE, origin: PauseOrigin.Breaker, resumesAt: '2026-09-21T16:40:00Z' });
    renderView();

    const banner = await screen.findByRole('status');

    expect(banner.textContent).toContain(AnalyticsPipelinesI18nKey.PausedByBreaker);
    expect(banner.textContent).toContain(AnalyticsPipelinesI18nKey.PausedResumesAt);
  });

  test('raises no banner for a pipeline the runner does not report as paused', async () => {
    renderView();

    await waitFor(() => expect(getPausedPipelines).toHaveBeenCalled());
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.PausedBannerTitle)).toBeNull();
  });

  test('confirms a pause, stating what stops and that it does not survive a restart', async () => {
    const user = userEvent.setup();
    renderView();

    await openRuntime(user);
    await user.click(tabControl(AnalyticsPipelinesI18nKey.Pause));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.PauseConfirmTitle)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.PauseConfirmBody)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.PauseConfirmRuntimeAction)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.PauseConfirmRestart)).toBeTruthy();
  });

  test('pauses the pipeline once the confirmation is accepted, and re-reads the runner', async () => {
    const user = userEvent.setup();
    renderView();

    await openRuntime(user);
    await user.click(tabControl(AnalyticsPipelinesI18nKey.Pause));
    asPaused(OPERATOR_PAUSE);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: AnalyticsPipelinesI18nKey.Pause }));

    await waitFor(() => expect(pausePipeline).toHaveBeenCalledWith('feedback-live'));
    expect(showNotification).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimePaused)).toBeTruthy());
  });

  test('resumes without a confirmation step', async () => {
    const user = userEvent.setup();
    asPaused(OPERATOR_PAUSE);
    renderView();

    await openRuntime(user);
    await user.click(tabControl(AnalyticsPipelinesI18nKey.Resume));

    await waitFor(() => expect(resumePipeline).toHaveBeenCalledWith('feedback-live'));
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.PauseConfirmTitle)).toBeNull();
  });

  test('reports a refused pause with the cause the operator can act on', async () => {
    const user = userEvent.setup();
    vi.mocked(pausePipeline).mockResolvedValue({
      success: false,
      errorHeader: 'pipeline_cache_cold',
      errorMessage: 'not loaded',
      requestId: 'trace-1',
    });
    renderView();

    await openRuntime(user);
    await user.click(tabControl(AnalyticsPipelinesI18nKey.Pause));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: AnalyticsPipelinesI18nKey.Pause }));

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: AnalyticsPipelinesI18nKey.PauseFailed,
        description: AnalyticsPipelinesI18nKey.RunnerCold,
        requestId: 'trace-1',
      }),
    );
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimePaused)).toBeNull();
  });

  // Unlike Disable, a pause sends no part of the document, so a pending edit has nothing to lose.
  test('keeps the pause control actionable while the form has unsaved edits', async () => {
    const user = userEvent.setup();
    renderView();

    const filter = await screen.findByLabelText(AnalyticsPipelinesI18nKey.Filter, { exact: false });
    await user.type(filter, 'x');
    await openRuntime(user);

    // The change bar is up, so Delete and the enable toggle are hidden — the pause is not.
    expect(
      screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DeletePipeline }).closest('[inert]'),
    ).toBeTruthy();
    expect(tabControl(AnalyticsPipelinesI18nKey.Pause)).toBeTruthy();
    expect(tabControl(AnalyticsPipelinesI18nKey.Pause)).not.toHaveProperty('disabled', true);
  });
});
