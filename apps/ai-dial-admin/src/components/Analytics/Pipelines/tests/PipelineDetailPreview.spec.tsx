import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getPipelineRuntimeView,
  getTable,
  getTables,
  listPipelineBackfills,
  previewPipeline,
  updatePipeline,
} from '@/src/app/[lang]/pipelines/actions';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey, PipelinePreviewI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Pipeline, PipelineKind, TriggerKind, TransformType } from '@/src/models/analytics/pipeline';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/pipelines/actions');
const backfillSidebar = vi.hoisted(() => ({ showSidebar: vi.fn(), closeSidebar: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const context = { analyticsEnabled: true, isFullAdmin: true };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    isFullAdmin: context.isFullAdmin,
    isReadOnlyAdmin: !context.isFullAdmin,
    isEnableAuth: true,
    featureFlags: { analyticsEnabled: context.analyticsEnabled },
    sidebar: backfillSidebar,
  }),
}));

vi.mock('@/src/components/Analytics/Pipelines/PipelineAudit', () => ({ default: () => <div>pipeline-audit</div> }));

// Monaco is heavy and meaningless in jsdom — the editor only has to occupy the body here.
vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: () => <div role="application" aria-label="JSON editor" />,
}));

// The grid is the library's; here it only has to say that a sample was drawn.
vi.mock('@/src/components/Analytics/Pipelines/Preview/PreviewGrid', () => ({
  default: () => <div role="grid" aria-label="sample" />,
}));

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
  transform: { type: TransformType.Sql, outputs: { rate_event_count: 'count(*)' } },
  target: 'turn_feedback',
  trigger: { kind: TriggerKind.Schedule },
  enabled: true,
  grain_key: 'response_id',
  version_column: 'ingested_at',
  generation: 7,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
  state: { lag_seconds: 12, has_more: false },
};

const sample = {
  columns: [{ name: 'response_id', role: 'grain_key', type: 'string' }],
  rows: [{ response_id: 'a1' }],
  notes: [],
};

const renderView = (override?: Partial<Pipeline>) =>
  render(<PipelineDetailView pipeline={{ ...rule, ...override }} takenTargets={['turn_feedback']} />);

const tabNames = () => screen.getAllByRole('tab').map((tab) => tab.textContent);
const previewTab = () => screen.getByRole('tab', { name: TabsI18nKey.Preview });
const propertiesTab = () => screen.getByRole('tab', { name: TabsI18nKey.Properties });
const filterField = () => screen.getByLabelText(AnalyticsPipelinesI18nKey.Filter, { exact: false });
const editFilter = async (user: ReturnType<typeof userEvent.setup>, value: string) => {
  await user.clear(filterField());
  await user.type(filterField(), value);
};

beforeEach(() => {
  vi.clearAllMocks();
  context.analyticsEnabled = true;
  context.isFullAdmin = true;
  vi.mocked(listPipelineBackfills).mockResolvedValue({ success: true, response: [] });
  vi.mocked(getTables).mockResolvedValue([enrichment, sourceTable]);
  vi.mocked(getTable).mockImplementation(
    async (name) => [enrichment, sourceTable].find((table) => table.name === name) ?? null,
  );
  vi.mocked(updatePipeline).mockResolvedValue({ success: true, response: { generation: 8 } });
  vi.mocked(getPipelineRuntimeView).mockResolvedValue({ success: false });
  vi.mocked(previewPipeline).mockResolvedValue({ success: true, response: sample as never });
});

describe('PipelineDetailFrame — the Preview tab', () => {
  test('sits second in the strip, after Properties', () => {
    renderView();

    expect(tabNames()).toEqual([TabsI18nKey.Properties, TabsI18nKey.Preview, TabsI18nKey.Runtime, TabsI18nKey.Audit]);
  });

  test('is withheld from a caller who is not a full admin', () => {
    context.isFullAdmin = false;
    renderView();

    expect(screen.queryByRole('tab', { name: TabsI18nKey.Preview })).toBeNull();
    expect(tabNames()).toEqual([TabsI18nKey.Properties, TabsI18nKey.Audit]);
  });

  test('is absent with analytics disabled, and no preview is requested', () => {
    context.analyticsEnabled = false;
    renderView();

    expect(screen.queryByRole('tab')).toBeNull();
    expect(previewPipeline).not.toHaveBeenCalled();
  });

  test('issues no request when it is opened', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(previewTab());

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(TabsI18nKey.Preview);
    expect(screen.getByRole('button', { name: PipelinePreviewI18nKey.RunPreview })).toBeInTheDocument();
    expect(previewPipeline).not.toHaveBeenCalled();
  });

  test('runs the named pipeline once when Run preview is pressed, and draws the sample', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(previewTab());

    await user.click(screen.getByRole('button', { name: PipelinePreviewI18nKey.RunPreview }));

    expect(await screen.findByRole('grid', { name: 'sample' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: PipelinePreviewI18nKey.RunAgain })).toBeInTheDocument();
    expect(previewPipeline).toHaveBeenCalledOnce();
    expect(previewPipeline).toHaveBeenCalledWith('feedback-live');
  });

  test('holds the result across a switch to Properties and back, with no second request', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(previewTab());
    await user.click(screen.getByRole('button', { name: PipelinePreviewI18nKey.RunPreview }));
    await screen.findByRole('grid', { name: 'sample' });

    await user.click(propertiesTab());
    expect(screen.queryByRole('grid', { name: 'sample' })).toBeNull();
    await user.click(previewTab());

    expect(screen.getByRole('grid', { name: 'sample' })).toBeInTheDocument();
    expect(previewPipeline).toHaveBeenCalledOnce();
  });

  test('keeps a pending field edit and its change bar across a switch to Preview and back', async () => {
    const user = userEvent.setup();
    renderView();
    await editFilter(user, 'score > 0.5');

    await user.click(previewTab());
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Discard })).toBeInTheDocument();

    await user.click(propertiesTab());

    expect(filterField()).toHaveValue('score > 0.5');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeInTheDocument();
  });

  test('says the preview uses the saved version while an edit is pending', async () => {
    const user = userEvent.setup();
    renderView();
    await editFilter(user, 'score > 0.5');

    await user.click(previewTab());

    expect(screen.getByText(PipelinePreviewI18nKey.UnsavedTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: PipelinePreviewI18nKey.RunOnSavedVersion })).toBeInTheDocument();
  });

  test('opens Properties from a refused preview without discarding a pending edit', async () => {
    vi.mocked(previewPipeline).mockResolvedValue({
      success: false,
      status: 422,
      errorHeader: 'pipeline_validation_failed',
      errorMessage: 'transform.outputs is empty',
    });
    const user = userEvent.setup();
    renderView();
    await editFilter(user, 'score > 0.5');
    await user.click(previewTab());
    await user.click(screen.getByRole('button', { name: PipelinePreviewI18nKey.RunOnSavedVersion }));

    await user.click(await screen.findByRole('button', { name: PipelinePreviewI18nKey.EmptyOpenProperties }));

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(TabsI18nKey.Properties);
    expect(filterField()).toHaveValue('score > 0.5');
  });

  test('is withdrawn with the rest of the strip while the JSON editor holds the view', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('switch'));

    expect(screen.queryByRole('tab', { name: TabsI18nKey.Preview })).toBeNull();
  });
});
