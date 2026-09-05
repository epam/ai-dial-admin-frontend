import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTable, getTables, updatePipeline } from '@/src/app/[lang]/pipelines/actions';
import { getEvaluator } from '@/src/app/[lang]/evaluators/actions';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { Pipeline, TriggerKind, PipelineKind } from '@/src/models/analytics/pipeline';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/pipelines/actions');
vi.mock('@/src/app/[lang]/evaluators/actions');

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

const evaluator: Evaluator = {
  name: 'feedback-rollup',
  version: 2,
  type: EvaluatorType.Sql,
  output_vars: [{ name: 'rate_event_count', type: 'long' }],
};

const enrichment: AnalyticsTable = {
  name: 'turn_feedback',
  type: AnalyticsTableType.Enrichment,
  source_table: 'dial_usage_log',
  grain: { grain_key: 'response_id' },
  columns: [{ source_name: 'rate_event_count', name: 'rate_event_count', type: AnalyticsFieldType.Long }],
};

const sourceTable: AnalyticsTable = { name: 'dial_usage_log', type: AnalyticsTableType.Source, columns: [] };

const rule: Pipeline = {
  name: 'feedback-live',
  kind: PipelineKind.Enrich,
  evaluator_name: 'feedback-rollup',
  evaluator,
  target: 'turn_feedback',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  grain_key: 'response_id',
  version_column: 'ingested_at',
  generation: 7,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  output_bindings: [{ column: 'rate_event_count', var: 'rate_event_count' }],
};

const renderView = (override?: Partial<Pipeline>) =>
  render(
    <PipelineDetailView
      pipeline={{ ...rule, ...override }}
      evaluators={[{ name: 'feedback-rollup', latest_version: 2 }]}
      takenTargets={['turn_feedback']}
    />,
  );

// Looked up by label, not by current value, so the same helper works when an edit restores the original.
const editSampling = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  const input = screen.getByLabelText(AnalyticsPipelinesI18nKey.Sampling, { exact: false });
  await user.clear(input);
  await user.type(input, value);
};

const editCadence = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  const input = screen.getByLabelText(AnalyticsPipelinesI18nKey.Cadence, { exact: false });
  await user.clear(input);
  await user.type(input, value);
};

describe('PipelineDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTables).mockResolvedValue([enrichment, sourceTable]);
    vi.mocked(getTable).mockImplementation(
      async (name) => [enrichment, sourceTable].find((table) => table.name === name) ?? null,
    );
    vi.mocked(getEvaluator).mockResolvedValue(evaluator);
    vi.mocked(updatePipeline).mockResolvedValue({ success: true });
  });

  test('presents the name as an identity rather than as a field', () => {
    renderView();

    expect(screen.getByRole('heading', { name: 'feedback-live' })).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: AnalyticsPipelinesI18nKey.Name })).toBeNull();
  });

  // Both facts live inside collapsed sections of the form, so without this the page could not say which
  // table the rule is bound to without a trip back to the listing.
  const header = () =>
    screen.getByRole('heading', { name: 'feedback-live' }).parentElement?.parentElement as HTMLElement;

  const facts = () => screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.ReadOnlyFacts });

  test('states the target and the read source among the facts, both reachable', async () => {
    renderView();

    expect(within(facts()).getByRole('link', { name: 'turn_feedback' })).toHaveAttribute(
      'href',
      '/tables/turn_feedback',
    );
    await waitFor(() => expect(within(facts()).getByRole('link', { name: 'dial_usage_log' })).toBeTruthy());
  });

  test('falls back to a placeholder while the followed source is unresolved', () => {
    vi.mocked(getTable).mockResolvedValue(null);
    renderView();

    expect(within(facts()).getAllByText(AnalyticsPipelinesI18nKey.NotSet).length).toBeGreaterThan(0);
  });

  test('states a pinned read source instead of the target’s own', async () => {
    renderView({ inputs: ['otel_claude_code_logs'] });

    await waitFor(() => expect(within(facts()).getByRole('link', { name: 'otel_claude_code_logs' })).toBeTruthy());
  });

  test('offers a control that copies the name', () => {
    renderView();

    // CopyButton names itself `copy {valueLabel}`, so the control is addressable rather than an unnamed icon.
    expect(within(header()).getByRole('button', { name: `copy ${AnalyticsPipelinesI18nKey.Name}` })).toBeTruthy();
  });

  test('states the rule status ahead of its name', () => {
    renderView();

    const badge = screen.getByText(AnalyticsPipelinesI18nKey.StatusEnabled);
    const heading = screen.getByRole('heading', { name: 'feedback-live' });

    // The badge leads the header; DOCUMENT_POSITION_FOLLOWING means the heading comes after it.
    expect(badge.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('presents the derived facts read-only', () => {
    renderView();

    const facts = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.ReadOnlyFacts });

    expect(facts).toBeTruthy();
    expect(screen.getByText('response_id')).toBeTruthy();
    expect(screen.getByText('ingested_at')).toBeTruthy();
    expect(screen.getByText('feedback-rollup@2')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
  });

  test('links the resolved evaluator to its page at the version the rule resolved to', () => {
    renderView();

    expect(screen.getByRole('link', { name: 'feedback-rollup@2' })).toHaveAttribute(
      'href',
      '/evaluators/feedback-rollup?version=2',
    );
  });

  test('renders an em dash for an absent version column', () => {
    renderView({ version_column: undefined });

    const versionColumn = within(facts()).getByText(AnalyticsPipelinesI18nKey.VersionColumn).parentElement;
    expect(within(versionColumn as HTMLElement).getByText(AnalyticsPipelinesI18nKey.NotSet)).toBeTruthy();
  });

  test('offers nothing to save until something is edited', async () => {
    renderView();

    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Discard })).toBeNull();
  });

  test('offers save and discard once a value changes', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editCadence(user, 'PT2H');

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeTruthy();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Discard })).toBeTruthy();
  });

  test('withdraws save when the value is edited back to what it was', async () => {
    const user = userEvent.setup();
    renderView({ cadence: 'PT1H' });
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editCadence(user, 'PT2H');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeTruthy();

    await editCadence(user, 'PT1H');

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('discard restores the loaded value after confirmation', async () => {
    const user = userEvent.setup();
    renderView({ cadence: 'PT1H' });
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editCadence(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect(screen.getByDisplayValue('PT1H')).toBeTruthy();
  });

  test('saves the whole rule and re-reads it', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editCadence(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(updatePipeline).toHaveBeenCalled());
    const [name, dto] = vi.mocked(updatePipeline).mock.calls[0];
    expect(name).toBe('feedback-live');
    expect(dto.cadence).toBe('PT2H');
    expect(refresh).toHaveBeenCalled();
  });

  test('carries a member no control presents through the save', async () => {
    const user = userEvent.setup();
    renderView({ filter: 'score > 0.5', cadence: 'PT1H', rate_rpm: 60 });
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editSampling(user, '0.5');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(updatePipeline).toHaveBeenCalled());
    const [, dto] = vi.mocked(updatePipeline).mock.calls[0];
    expect(dto.filter).toBe('score > 0.5');
    expect(dto.cadence).toBe('PT1H');
    expect(dto.rate_rpm).toBe(60);
  });

  test('never sends a member the API refuses', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editCadence(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(updatePipeline).toHaveBeenCalled());
    const [, dto] = vi.mocked(updatePipeline).mock.calls[0] as unknown as [string, Record<string, unknown>];
    ['evaluator', 'grain_key', 'version_column', 'generation', 'created_at', 'updated_at', 'state'].forEach((key) =>
      expect(dto).not.toHaveProperty(key),
    );
  });

  test('surfaces the service message and keeps the edit when a save is rejected', async () => {
    vi.mocked(updatePipeline).mockResolvedValue({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'target already bound',
    });
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editCadence(user, 'PT2H');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(showNotification.mock.calls[0][0]).toMatchObject({ description: 'target already bound' });
    expect(screen.getByDisplayValue('PT2H')).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
  });

  test('groups the members into collapsible sections', () => {
    renderView();

    [
      AnalyticsPipelinesI18nKey.SectionReadScope,
      AnalyticsPipelinesI18nKey.SectionInputBindings,
      AnalyticsPipelinesI18nKey.SectionBindings,
      AnalyticsPipelinesI18nKey.SectionExecution,
    ].forEach((section) => expect(screen.getByRole('button', { name: section })).toBeTruthy());
  });

  test('leaves identity and trigger open rather than behind a section header', () => {
    renderView();

    // The two an operator always needs are flat; only the optional groups collapse.
    expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.Name, { exact: false })).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.TriggerKind)).toBeTruthy();
  });

  test('offers enabling as its own action rather than a form field', () => {
    renderView();

    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline })).toBeTruthy();
  });

  test('presents disabling as a danger action', () => {
    renderView();

    const toggle = screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline });
    expect(toggle.className).toContain('dial-danger-outlined-button');
  });

  test('presents enabling as the primary action', () => {
    renderView({ enabled: false });

    const toggle = screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.EnablePipeline });
    expect(toggle.className).toContain('dial-primary-solid-button');
  });

  test('confirms before disabling a rule', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline }));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.DisableConfirmTitle)).toBeTruthy();
    expect(updatePipeline).not.toHaveBeenCalled();
  });

  test('sends the stored rule with enabled flipped, not the pending edits', async () => {
    const user = userEvent.setup();
    renderView({ filter: 'score > 0.5' });
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline }));
    // The popup takes over the query scope, so this now uniquely matches its confirm button.
    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline }));

    await waitFor(() => expect(updatePipeline).toHaveBeenCalled());
    const [, dto] = vi.mocked(updatePipeline).mock.calls[0];
    expect(dto.enabled).toBe(false);
    expect(dto.filter).toBe('score > 0.5');
    expect(refresh).toHaveBeenCalled();
  });

  test('withholds the toggle while edits are pending, because it would refresh them away', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editCadence(user, 'PT2H');

    const toggle = screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline });
    // Withheld in place rather than removed: a vanished control answers "where did it go?" with nothing.
    expect(toggle).toBeDisabled();
    expect(toggle.getAttribute('title')).toBe(AnalyticsPipelinesI18nKey.ToggleBlockedByEdits);
  });

  test('opens on the sections a rule is usually read for', () => {
    renderView();

    // Identity is expanded, so its first control is on screen without a click.
    expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.Name, { exact: false })).toBeTruthy();
  });

  test('still offers the rule its own target even though it is taken', async () => {
    renderView();

    await waitFor(() => expect(screen.getByText('turn_feedback')).toBeTruthy());
  });
});
