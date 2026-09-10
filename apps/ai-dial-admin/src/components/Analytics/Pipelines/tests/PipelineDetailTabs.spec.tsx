import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTable, getTables, updatePipeline } from '@/src/app/[lang]/pipelines/actions';
import { getEvaluator } from '@/src/app/[lang]/evaluators/actions';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { Pipeline, PipelineKind, TriggerKind } from '@/src/models/analytics/pipeline';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/pipelines/actions');
vi.mock('@/src/app/[lang]/evaluators/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: vi.fn(), removeNotification: vi.fn() }),
}));

// The global AppContext mock in test-setup.tsx carries `featureFlags: { deploymentsEnabled: true }`,
// so the strip is off in every shipped pipeline spec; this file is the one that turns it on.
const context = { analyticsEnabled: true, isFullAdmin: true };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    isFullAdmin: context.isFullAdmin,
    isReadOnlyAdmin: !context.isFullAdmin,
    isEnableAuth: true,
    featureFlags: { analyticsEnabled: context.analyticsEnabled },
  }),
}));

// PipelineAudit's own contract is covered in PipelineAudit.spec.tsx; here it stands in for "the
// activities list rendered", and its absence for "no analytics activity request issued".
const auditPropsSpy = vi.fn();
vi.mock('@/src/components/Analytics/Pipelines/PipelineAudit', () => ({
  default: (props: { pipeline: Pipeline }) => {
    auditPropsSpy(props);
    return <div>pipeline-audit</div>;
  },
}));

// Monaco is heavy and meaningless in jsdom — the editor only has to occupy the body here.
vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: () => <div role="application" aria-label="JSON editor" />,
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
  // Carried so the runtime-state section renders: without a `state` it returns null, and the
  // Properties body would then be indistinguishable from one missing a section.
  state: { lag_seconds: 12, has_more: false },
};

const renderView = (override?: Partial<Pipeline>) =>
  render(
    <PipelineDetailView
      pipeline={{ ...rule, ...override }}
      evaluators={[{ name: 'feedback-rollup', latest_version: 2 }]}
      takenTargets={['turn_feedback']}
    />,
  );

const auditTab = () => screen.getByRole('tab', { name: TabsI18nKey.Audit });
const propertiesTab = () => screen.getByRole('tab', { name: TabsI18nKey.Properties });
const facts = () => screen.queryByRole('region', { name: AnalyticsPipelinesI18nKey.ReadOnlyFacts });
const jsonToggle = () => within(screen.getByRole('switch')).getByRole('checkbox');
// The read filter is the plainest editable member: an unvalidated textarea bound straight to the
// draft, so what it presents after a tab switch is what the draft still holds.
const filterField = () => screen.getByLabelText(AnalyticsPipelinesI18nKey.Filter, { exact: false });
const editFilter = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  await user.clear(filterField());
  await user.type(filterField(), value);
};

beforeEach(() => {
  vi.clearAllMocks();
  context.analyticsEnabled = true;
  context.isFullAdmin = true;
  vi.mocked(getTables).mockResolvedValue([enrichment, sourceTable]);
  vi.mocked(getTable).mockImplementation(
    async (name) => [enrichment, sourceTable].find((table) => table.name === name) ?? null,
  );
  vi.mocked(getEvaluator).mockResolvedValue(evaluator);
  vi.mocked(updatePipeline).mockResolvedValue({ success: true });
});

describe('PipelineDetailFrame — the Properties and Audit tabs', () => {
  test('opens on Properties, with the read-only facts and the runtime state beneath it', () => {
    renderView();

    expect(propertiesTab()).toBeInTheDocument();
    expect(auditTab()).toBeInTheDocument();
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(TabsI18nKey.Properties);
    expect(facts()).toBeInTheDocument();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.SectionRuntimeState)).toBeInTheDocument();
    expect(screen.queryByText('pipeline-audit')).not.toBeInTheDocument();
  });

  test('replaces the Properties body with the activities list when Audit is selected', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(auditTab());

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(TabsI18nKey.Audit);
    expect(screen.getByText('pipeline-audit')).toBeInTheDocument();
    expect(auditPropsSpy).toHaveBeenCalledWith({ pipeline: expect.objectContaining({ name: 'feedback-live' }) });
    expect(facts()).toBeNull();
  });

  test('keeps the badge, the name and the enable/disable control above the strip on the Audit tab', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(auditTab());

    const heading = screen.getByRole('heading', { name: 'feedback-live' });
    const disableControl = screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline });
    expect(screen.getByText(AnalyticsPipelinesI18nKey.StatusEnabled)).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
    expect(disableControl).toBeInTheDocument();
    // `DOCUMENT_POSITION_FOLLOWING` on the strip means the identity row precedes it in the document.
    expect(heading.compareDocumentPosition(auditTab()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(disableControl.compareDocumentPosition(auditTab()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('offers the strip and a selectable Audit tab on a disabled pipeline', async () => {
    const user = userEvent.setup();
    renderView({ enabled: false });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.StatusDisabled)).toBeInTheDocument();

    await user.click(auditTab());

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(TabsI18nKey.Audit);
    expect(screen.getByText('pipeline-audit')).toBeInTheDocument();
  });

  test('offers the Audit tab to a caller who is not a full admin', async () => {
    context.isFullAdmin = false;
    const user = userEvent.setup();
    renderView();

    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline })).toBeNull();

    await user.click(auditTab());

    expect(screen.getByText('pipeline-audit')).toBeInTheDocument();
  });

  test('keeps a pending field edit and its change bar across a switch to Audit and back', async () => {
    const user = userEvent.setup();
    renderView();

    await editFilter(user, 'score > 0.5');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeInTheDocument();

    await user.click(auditTab());
    expect(screen.getByText('pipeline-audit')).toBeInTheDocument();
    // The change bar belongs to the identity row, so it stays offered while the history is on screen.
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Discard })).toBeInTheDocument();

    await user.click(propertiesTab());

    expect(filterField()).toHaveValue('score > 0.5');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Discard })).toBeInTheDocument();
  });

  test('withdraws the strip while the JSON editor holds the view and restores it on Properties', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(auditTab());
    await user.click(jsonToggle());

    expect(screen.getByRole('application', { name: 'JSON editor' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByText('pipeline-audit')).not.toBeInTheDocument();

    await user.click(jsonToggle());

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(TabsI18nKey.Properties);
    expect(facts()).toBeInTheDocument();
  });

  test('renders no strip, no Audit tab and no activity request with analytics disabled', () => {
    context.analyticsEnabled = false;
    renderView();

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: TabsI18nKey.Audit })).toBeNull();
    expect(screen.queryByText('pipeline-audit')).not.toBeInTheDocument();
    expect(auditPropsSpy).not.toHaveBeenCalled();
    expect(facts()).toBeInTheDocument();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.SectionRuntimeState)).toBeInTheDocument();
  });
});
