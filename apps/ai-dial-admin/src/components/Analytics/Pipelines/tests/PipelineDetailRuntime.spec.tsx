import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getPipelineFailures,
  getPipelineRuntimeView,
  getTable,
  getTables,
  pausePipeline,
  resumePipeline,
} from '@/src/app/[lang]/pipelines/actions';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import { AnalyticsPipelinesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { DlqPage } from '@/src/models/analytics/pipeline-dlq';
import { Pipeline, PipelineKind, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
import {
  PipelinePause,
  PipelineRuntimeState,
  PipelineRuntimeView,
  PauseOrigin,
  RUNNER_PIPELINE_NOT_FOUND,
} from '@/src/models/analytics/pipeline-runtime';
import { runtimeView } from '@/src/components/Analytics/Pipelines/Common/tests/mock';
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
  trigger: { kind: TriggerKind.Schedule },
  enabled: true,
  grain_key: 'response_id',
  version_column: 'ingested_at',
  generation: 7,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  state: { last_run_at: '2026-09-21T16:12:08Z', lag_seconds: 38 },
};

const OPERATOR_PAUSE: PipelinePause = {
  origin: PauseOrigin.Operator,
  reason: 'paused by an operator',
  since: '2026-09-21T15:40:00Z',
};

/** The runner holds the pipeline and answers for it. */
const asRuntime = (view?: Partial<PipelineRuntimeView>) =>
  vi.mocked(getPipelineRuntimeView).mockResolvedValue({
    success: true,
    response: runtimeView({ pipeline_name: 'feedback-live', ...view }),
  });

/** The same view, reporting the pause in force. The detail page reads the pause from here. */
const asPaused = (pause?: PipelinePause) =>
  asRuntime(pause ? { status: { state: PipelineRuntimeState.Paused, ...pause } } : undefined);

/** A synced runner that does not hold this pipeline — the answer the page states as `not running`. */
const asNotHeld = () =>
  vi.mocked(getPipelineRuntimeView).mockResolvedValue({ success: false, errorHeader: RUNNER_PIPELINE_NOT_FOUND });

/** The control lives in the Runtime tab's bar; the banner carries a second Resume while paused. */
const tabControl = (name: string) => screen.getAllByRole('button', { name }).at(-1) as HTMLElement;

const openRuntime = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(await screen.findByText(TabsI18nKey.Runtime));

const page = (total: number): DlqPage => ({
  items: [],
  has_more: false,
  total,
  requeueable_total: total,
});

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
    asRuntime();
    vi.mocked(getPipelineFailures).mockResolvedValue({ success: true, response: page(0) });
    vi.mocked(pausePipeline).mockResolvedValue({ success: true });
    vi.mocked(resumePipeline).mockResolvedValue({ success: true });
  });

  // The strip answers whether something is wrong; how many is one click away, on the card that can act
  // on them. The kit hides a tab's icon from assistive technology, so the count is stated in text
  // beside the strip rather than on the mark.
  // The mark is decorative by construction — the kit hides a tab's icon — so the count is stated in
  // text beside the strip. A fault signalled by colour alone is signalled to nobody.
  test('states the failure count beside the tab strip for a model-calling enrichment', async () => {
    vi.mocked(getPipelineFailures).mockResolvedValue({ success: true, response: page(7) });
    renderView({ transform: { type: TransformType.Llm } });

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.FailuresBadge)).toBeTruthy();
  });

  test('states no count when the pipeline holds no dead letters', async () => {
    vi.mocked(getPipelineFailures).mockResolvedValue({ success: true, response: page(0) });
    renderView({ transform: { type: TransformType.Llm } });

    expect(await screen.findByText(TabsI18nKey.Runtime)).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.FailuresBadge)).toBeNull();
  });

  // A statement either applies to the batch or fails it, so there is nothing per-row to ask about.
  test('asks for no failures at all for a SQL enrichment', async () => {
    renderView();

    await waitFor(() => expect(getPipelineRuntimeView).toHaveBeenCalled());
    expect(getPipelineFailures).not.toHaveBeenCalled();
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
    expect(getPipelineRuntimeView).not.toHaveBeenCalled();
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

    await waitFor(() => expect(getPipelineRuntimeView).toHaveBeenCalled());
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeRunning)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimePaused)).toBeNull();
  });

  // The registry presents it as healthy while nothing drives it, so a chip alone will not do.
  test('warns when the runner has not taken the pipeline on', async () => {
    asNotHeld();
    renderView();

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.RuntimeNotTrackedTitle)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimeNotTracked)).toBeTruthy();
  });

  test('offers no pause for a pipeline nothing is running', async () => {
    const user = userEvent.setup();
    asNotHeld();
    renderView();

    await user.click(await screen.findByText(TabsI18nKey.Runtime));

    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.Pause })).toBeNull();
  });

  // ADAS drives aggregate pipelines on its own scheduler and the runner has never heard of them, so
  // the view is not even asked for: a 404 is the runner's answer for both a pipeline it refused and
  // one that was never its to run, and reading one here would state the first about the second.
  test('states no runtime status for an aggregate pipeline, and asks the runner nothing', async () => {
    renderView({ kind: PipelineKind.Aggregate, transform: undefined });

    expect(await screen.findByText(TabsI18nKey.Runtime)).toBeTruthy();
    expect(getPipelineRuntimeView).not.toHaveBeenCalled();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeNotTrackedTitle)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeRunning)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeNotTracked)).toBeNull();
  });

  test('states no runtime status when the runner did not answer', async () => {
    vi.mocked(getPipelineRuntimeView).mockResolvedValue({ success: false });
    renderView();

    await waitFor(() => expect(getPipelineRuntimeView).toHaveBeenCalled());
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
    asPaused({ ...OPERATOR_PAUSE, origin: PauseOrigin.Breaker, resumes_at: '2026-09-21T16:40:00Z' });
    renderView();

    const banner = await screen.findByRole('status');

    expect(banner.textContent).toContain(AnalyticsPipelinesI18nKey.PausedByBreaker);
    expect(banner.textContent).toContain(AnalyticsPipelinesI18nKey.PausedResumesAt);
  });

  // The evidence the breaker tripped on, worded by the service: the threshold and the window are its
  // configuration, so a console that restated them would be quoting a copy.
  test('states the reason a breaker pause was taken', async () => {
    asPaused({
      ...OPERATOR_PAUSE,
      origin: PauseOrigin.Breaker,
      reason: '7 of its last 50 group(s) dead-lettered',
    });
    renderView();

    const banner = await screen.findByRole('status');

    expect(banner.textContent).toContain(AnalyticsPipelinesI18nKey.PausedReason);
  });

  // The service records a fixed string for an operator pause that says only what the origin already
  // says, so repeating it would be the same sentence twice.
  test('states no reason for an operator pause', async () => {
    asPaused({ ...OPERATOR_PAUSE, reason: 'paused by an operator' });
    renderView();

    const banner = await screen.findByRole('status');

    expect(banner.textContent).not.toContain(AnalyticsPipelinesI18nKey.PausedReason);
  });

  test('raises no banner for a pipeline the runner does not report as paused', async () => {
    renderView();

    await waitFor(() => expect(getPipelineRuntimeView).toHaveBeenCalled());
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

  // The gates are pipelines that are enabled, taken on and consuming nothing. Each clears for a
  // different reason, and collapsing them into `running` would state the opposite of what an operator
  // has to act on.
  test('states a gated pipeline as gated and still offers to pause it', async () => {
    const user = userEvent.setup();
    asRuntime({ status: { state: PipelineRuntimeState.OverBudget } });
    renderView();

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.RuntimeOverBudget)).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeRunning)).toBeNull();

    await openRuntime(user);

    expect(tabControl(AnalyticsPipelinesI18nKey.Pause)).toBeTruthy();
  });

  // The runner holds the pause metadata in memory, so a restart can lose it while the pause survives.
  // Withholding the banner for a missing timestamp withheld the only Resume control on the page.
  test('offers Resume for a pause the runner can no longer describe', async () => {
    asRuntime({ status: { state: PipelineRuntimeState.Paused } });
    renderView();

    const banner = await screen.findByRole('status');

    expect(banner.textContent).toContain(AnalyticsPipelinesI18nKey.PausedBannerTitleUndated);
    expect(within(banner).getByRole('button', { name: AnalyticsPipelinesI18nKey.Resume })).toBeTruthy();
  });

  // The moment an operator most wants to stop a pipeline is the moment its runtime read is failing.
  test('keeps the pause control when the runtime read did not land', async () => {
    const user = userEvent.setup();
    vi.mocked(getPipelineRuntimeView).mockResolvedValue({ success: false, errorHeader: 'runtime_store_down' });
    renderView();

    await openRuntime(user);

    expect(tabControl(AnalyticsPipelinesI18nKey.Pause)).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeRunning)).toBeNull();
  });

  // The runner syncs on its own cadence, so an operator who has just saved would otherwise read an
  // unchanged runtime as a save that did nothing.
  test('states that the runner is running an earlier revision than the registry', async () => {
    const user = userEvent.setup();
    asRuntime({ generation: 6 });
    renderView();

    await openRuntime(user);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimeGenerationBehindTitle)).toBeTruthy();
  });

  test('says nothing about the revision when the two services agree', async () => {
    const user = userEvent.setup();
    renderView();

    await openRuntime(user);

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeGenerationBehindTitle)).toBeNull();
  });

  // The control fans out to three reads, one of which is a hook the tab cannot reach on its own.
  test('reads the runner again when the tab asks for a re-read', async () => {
    const user = userEvent.setup();
    renderView();

    await openRuntime(user);
    await waitFor(() => expect(getPipelineRuntimeView).toHaveBeenCalledOnce());

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.RuntimeReadAgain }));

    await waitFor(() => expect(getPipelineRuntimeView).toHaveBeenCalledTimes(2));
    expect(refresh).toHaveBeenCalled();
  });
});
