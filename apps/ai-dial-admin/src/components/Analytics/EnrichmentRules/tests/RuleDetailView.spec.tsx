import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTable, getTables, updateRule } from '@/src/app/[lang]/enrichment-rules/actions';
import { getEvaluator } from '@/src/app/[lang]/evaluators/actions';
import RuleDetailView from '@/src/components/Analytics/EnrichmentRules/RuleDetailView';
import { AnalyticsEnrichmentRulesI18nKey, ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRule, TriggerKind } from '@/src/models/analytics/rule';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/enrichment-rules/actions');
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

const rule: EnrichmentRule = {
  id: 'rule-1',
  name: 'feedback-live',
  evaluator_name: 'feedback-rollup',
  evaluator,
  target_enrichment: 'turn_feedback',
  trigger_kind: TriggerKind.OnIngest,
  enabled: true,
  grain_key: 'response_id',
  version_column: 'ingested_at',
  generation: 7,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  output_bindings: [{ column: 'rate_event_count', var: 'rate_event_count' }],
};

const renderView = (override?: Partial<EnrichmentRule>) =>
  render(
    <RuleDetailView
      originalRule={{ ...rule, ...override }}
      evaluators={[{ name: 'feedback-rollup', latest_version: 2 }]}
      takenTargets={['turn_feedback']}
    />,
  );

// Looked up by label, not by current value, so the same helper works when an edit restores the original.
const editName = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  const input = screen.getByLabelText(AnalyticsEnrichmentRulesI18nKey.Name, { exact: false });
  await user.clear(input);
  await user.type(input, value);
};

describe('RuleDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTables).mockResolvedValue([enrichment, sourceTable]);
    vi.mocked(getTable).mockImplementation(
      async (name) => [enrichment, sourceTable].find((table) => table.name === name) ?? null,
    );
    vi.mocked(getEvaluator).mockResolvedValue(evaluator);
    vi.mocked(updateRule).mockResolvedValue({ success: true });
  });

  test('renders the rule name, and its id among the facts rather than under the name', () => {
    renderView();

    expect(screen.getByRole('heading', { name: 'feedback-live' })).toBeTruthy();

    const facts = screen.getByRole('region', { name: AnalyticsEnrichmentRulesI18nKey.ReadOnlyFacts });
    expect(within(facts).getByText('rule-1')).toBeTruthy();
    expect(within(facts).getByText(EntityFieldsI18nKey.id)).toBeTruthy();
  });

  test('offers a control that copies the id', () => {
    renderView();

    const facts = screen.getByRole('region', { name: AnalyticsEnrichmentRulesI18nKey.ReadOnlyFacts });
    // CopyButton names itself `copy {valueLabel}`, so the control is addressable rather than an unnamed icon.
    expect(within(facts).getByRole('button', { name: `copy ${EntityFieldsI18nKey.id}` })).toBeTruthy();
  });

  test('states the rule status ahead of its name', () => {
    renderView();

    const badge = screen.getByText(AnalyticsEnrichmentRulesI18nKey.StatusEnabled);
    const heading = screen.getByRole('heading', { name: 'feedback-live' });

    // The badge leads the header; DOCUMENT_POSITION_FOLLOWING means the heading comes after it.
    expect(badge.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('presents the derived facts read-only', () => {
    renderView();

    const facts = screen.getByRole('region', { name: AnalyticsEnrichmentRulesI18nKey.ReadOnlyFacts });

    expect(facts).toBeTruthy();
    expect(screen.getByText('response_id')).toBeTruthy();
    expect(screen.getByText('ingested_at')).toBeTruthy();
    expect(screen.getByText('feedback-rollup@2')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
  });

  test('renders an em dash for an absent version column', () => {
    renderView({ version_column: undefined });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.NotSet)).toBeTruthy();
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

    await editName(user, 'renamed');

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeTruthy();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Discard })).toBeTruthy();
  });

  test('withdraws save when the value is edited back to what it was', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editName(user, 'renamed');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeTruthy();

    await editName(user, 'feedback-live');

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('discard restores the loaded value after confirmation', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editName(user, 'renamed');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect(screen.getByDisplayValue('feedback-live')).toBeTruthy();
  });

  test('saves the whole rule and re-reads it', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editName(user, 'renamed');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(updateRule).toHaveBeenCalled());
    const [id, dto] = vi.mocked(updateRule).mock.calls[0];
    expect(id).toBe('rule-1');
    expect(dto.name).toBe('renamed');
    expect(refresh).toHaveBeenCalled();
  });

  test('carries a member no control presents through the save', async () => {
    const user = userEvent.setup();
    renderView({ filter_sql: 'score > 0.5', cadence: 'PT1H', rate_rpm: 60 });
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editName(user, 'renamed');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(updateRule).toHaveBeenCalled());
    const [, dto] = vi.mocked(updateRule).mock.calls[0];
    expect(dto.filter_sql).toBe('score > 0.5');
    expect(dto.cadence).toBe('PT1H');
    expect(dto.rate_rpm).toBe(60);
  });

  test('never sends a member the API refuses', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editName(user, 'renamed');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(updateRule).toHaveBeenCalled());
    const [, dto] = vi.mocked(updateRule).mock.calls[0] as unknown as [string, Record<string, unknown>];
    ['id', 'evaluator', 'grain_key', 'version_column', 'generation', 'created_at', 'updated_at'].forEach((key) =>
      expect(dto).not.toHaveProperty(key),
    );
  });

  test('surfaces the service message and keeps the edit when a save is rejected', async () => {
    vi.mocked(updateRule).mockResolvedValue({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'target already bound',
    });
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editName(user, 'renamed');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(showNotification.mock.calls[0][0]).toMatchObject({ description: 'target already bound' });
    expect(screen.getByDisplayValue('renamed')).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
  });

  test('groups the members into collapsible sections', () => {
    renderView();

    [
      AnalyticsEnrichmentRulesI18nKey.SectionReadScope,
      AnalyticsEnrichmentRulesI18nKey.SectionInputBindings,
      AnalyticsEnrichmentRulesI18nKey.SectionBindings,
      AnalyticsEnrichmentRulesI18nKey.SectionExecution,
    ].forEach((section) => expect(screen.getByRole('button', { name: section })).toBeTruthy());
  });

  test('leaves identity and trigger open rather than behind a section header', () => {
    renderView();

    // The two an operator always needs are flat; only the optional groups collapse.
    expect(screen.getByLabelText(AnalyticsEnrichmentRulesI18nKey.Name, { exact: false })).toBeTruthy();
    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.TriggerKind)).toBeTruthy();
  });

  test('offers enabling as its own action rather than a form field', () => {
    renderView();

    expect(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.DisableRule })).toBeTruthy();
  });

  test('presents disabling as a danger action', () => {
    renderView();

    const toggle = screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.DisableRule });
    expect(toggle.className).toContain('dial-danger-outlined-button');
  });

  test('presents enabling as the primary action', () => {
    renderView({ enabled: false });

    const toggle = screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.EnableRule });
    expect(toggle.className).toContain('dial-primary-solid-button');
  });

  test('confirms before disabling a rule', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.DisableRule }));

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.DisableConfirmTitle)).toBeTruthy();
    expect(updateRule).not.toHaveBeenCalled();
  });

  test('sends the stored rule with enabled flipped, not the pending edits', async () => {
    const user = userEvent.setup();
    renderView({ filter_sql: 'score > 0.5' });
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.DisableRule }));
    // The popup takes over the query scope, so this now uniquely matches its confirm button.
    await user.click(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.DisableRule }));

    await waitFor(() => expect(updateRule).toHaveBeenCalled());
    const [, dto] = vi.mocked(updateRule).mock.calls[0];
    expect(dto.enabled).toBe(false);
    expect(dto.filter_sql).toBe('score > 0.5');
    expect(refresh).toHaveBeenCalled();
  });

  test('withholds the toggle while edits are pending, because it would refresh them away', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    await editName(user, 'renamed');

    const toggle = screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.DisableRule });
    // Withheld in place rather than removed: a vanished control answers "where did it go?" with nothing.
    expect(toggle).toBeDisabled();
    expect(toggle.getAttribute('title')).toBe(AnalyticsEnrichmentRulesI18nKey.ToggleBlockedByEdits);
  });

  test('opens on the sections a rule is usually read for', () => {
    renderView();

    // Identity is expanded, so its first control is on screen without a click.
    expect(screen.getByLabelText(AnalyticsEnrichmentRulesI18nKey.Name, { exact: false })).toBeTruthy();
  });

  test('still offers the rule its own target even though it is taken', async () => {
    renderView();

    await waitFor(() => expect(screen.getByText('turn_feedback')).toBeTruthy());
  });
});
