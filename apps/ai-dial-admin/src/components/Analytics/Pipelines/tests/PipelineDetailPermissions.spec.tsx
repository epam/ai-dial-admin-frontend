import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTable, getTables, updatePipeline } from '@/src/app/[lang]/pipelines/actions';
import { getEvaluator } from '@/src/app/[lang]/evaluators/actions';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { Pipeline, TriggerKind, PipelineKind } from '@/src/models/analytics/pipeline';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/pipelines/actions');
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

const rule: Pipeline = {
  name: 'feedback-live',
  kind: PipelineKind.Enrich,
  evaluator_name: 'feedback-rollup',
  evaluator,
  target: 'turn_feedback',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  grain_key: 'response_id',
  generation: 7,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  output_bindings: [{ column: 'rate_event_count', var: 'rate_event_count' }],
};

const renderView = () =>
  render(
    <PipelineDetailView
      pipeline={rule}
      evaluators={[{ name: 'feedback-rollup', latest_version: 2 }]}
      takenTargets={['turn_feedback']}
    />,
  );

describe('PipelineDetailView — without full-admin rights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isFullAdmin.value = false;
    vi.mocked(getTables).mockResolvedValue([enrichment, sourceTable]);
    vi.mocked(getTable).mockImplementation(
      async (name) => [enrichment, sourceTable].find((table) => table.name === name) ?? null,
    );
    vi.mocked(getEvaluator).mockResolvedValue(evaluator);
    vi.mocked(updatePipeline).mockResolvedValue({ success: true });
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

    const cadence = screen.getByLabelText(AnalyticsPipelinesI18nKey.Cadence, { exact: false });
    await user.clear(cadence);
    await user.type(cadence, 'PT2H');

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Discard })).toBeNull();
  });

  test('offers no enable or disable action', async () => {
    renderView();

    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline })).toBeNull();
  });

  test('offers both once the caller has full-admin rights', async () => {
    isFullAdmin.value = true;
    renderView();

    await waitFor(() => expect(getEvaluator).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline })).toBeTruthy();
  });
});
