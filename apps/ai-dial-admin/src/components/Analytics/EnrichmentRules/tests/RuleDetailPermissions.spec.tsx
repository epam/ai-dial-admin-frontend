import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTable, getTables, updateRule } from '@/src/app/[lang]/enrichment-rules/actions';
import { getEvaluator } from '@/src/app/[lang]/evaluators/actions';
import RuleDetailView from '@/src/components/Analytics/EnrichmentRules/RuleDetailView';
import { AnalyticsEnrichmentRulesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRule, TriggerKind } from '@/src/models/analytics/rule';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/enrichment-rules/actions');
vi.mock('@/src/app/[lang]/evaluators/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

// test-setup.tsx pins isFullAdmin true for the whole suite, so the non-admin case needs its own file.
const isFullAdmin = { value: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ isFullAdmin: isFullAdmin.value, isEnableAuth: true, featureFlags: {} }),
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
  generation: 7,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  output_bindings: [{ column: 'rate_event_count', var: 'rate_event_count' }],
};

const renderView = () =>
  render(
    <RuleDetailView
      originalRule={rule}
      evaluators={[{ name: 'feedback-rollup', latest_version: 2 }]}
      takenTargets={['turn_feedback']}
    />,
  );

describe('RuleDetailView — without full-admin rights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isFullAdmin.value = false;
    vi.mocked(getTables).mockResolvedValue([enrichment, sourceTable]);
    vi.mocked(getTable).mockImplementation(
      async (name) => [enrichment, sourceTable].find((table) => table.name === name) ?? null,
    );
    vi.mocked(getEvaluator).mockResolvedValue(evaluator);
    vi.mocked(updateRule).mockResolvedValue({ success: true });
  });

  test('renders the rule so it can still be read', async () => {
    renderView();

    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: 'feedback-live' })).toBeTruthy();
  });

  test('offers no save even after a value is edited', async () => {
    const user = userEvent.setup();
    renderView();
    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());

    const name = screen.getByLabelText(AnalyticsEnrichmentRulesI18nKey.Name, { exact: false });
    await user.clear(name);
    await user.type(name, 'renamed');

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Discard })).toBeNull();
  });

  test('offers no enable or disable action', async () => {
    renderView();

    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.DisableRule })).toBeNull();
  });

  test('offers both once the caller has full-admin rights', async () => {
    isFullAdmin.value = true;
    renderView();

    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.DisableRule })).toBeTruthy();
  });
});
