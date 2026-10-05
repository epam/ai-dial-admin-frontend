import { render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getPausedPipelines, getRunnerPipelines } from '@/src/app/[lang]/pipelines/actions';
import PipelinesView from '@/src/components/Analytics/Pipelines/PipelinesView';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { PipelineKind, PipelineListItem, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
import { PauseOrigin } from '@/src/models/analytics/pipeline-runtime';

vi.mock('@/src/app/[lang]/pipelines/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: vi.fn() }),
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({ featureFlags: {}, isFullAdmin: true })),
}));

interface MockColDef {
  colId?: string;
  field?: string;
  headerName?: string;
  cellRenderer?: (params: { data: PipelineListItem }) => ReactNode;
  valueGetter?: (params: { data: PipelineListItem }) => unknown;
}

// The column under test renders a badge per row, so this stand-in runs the renderer rather than only
// listing the column ids the way the sibling spec's does.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData, columnDefs }: { rowData?: PipelineListItem[]; columnDefs?: MockColDef[] }) => {
    const runtime = columnDefs?.find((column) => column.colId === 'runtime');
    const inputs = columnDefs?.find((column) => column.colId === 'inputs');

    return (
      <div>
        <div>cols: {columnDefs?.map((column) => column.colId ?? column.field).join('|')}</div>
        {rowData?.map((row) => (
          <div key={row.name} aria-label={`row-${row.name}`}>
            {runtime?.cellRenderer?.({ data: row })}
            <span>{String(inputs?.valueGetter?.({ data: row }) ?? '')}</span>
          </div>
        ))}
      </div>
    );
  },
}));

const asFullAdmin = (isFullAdmin: boolean) =>
  vi.mocked(useAppContext).mockReturnValue({ featureFlags: {}, isFullAdmin } as never);

const pipeline = (overrides: Partial<PipelineListItem> = {}): PipelineListItem => ({
  name: 'turn-feedback-live',
  kind: PipelineKind.Enrich,
  transform_type: TransformType.Sql,
  target: 'turn_feedback',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  generation: 5,
  updated_at: '2026-08-21T09:37:29Z',
  ...overrides,
});

const PAUSED = pipeline({ name: 'usage-live', target: 'usage_client_identity' });
const DISABLED = pipeline({ name: 'session-topic', target: 'session_topic', enabled: false });

describe('PipelinesView — runtime column', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asFullAdmin(true);
    vi.mocked(getPausedPipelines).mockResolvedValue({
      success: true,
      response: [{ pipelineName: 'usage-live', origin: PauseOrigin.Operator, since: '2026-09-21T15:00:00Z' }],
    });
    vi.mocked(getRunnerPipelines).mockResolvedValue({
      success: true,
      response: ['turn-feedback-live', 'usage-live'].map((name) => ({ name, enabled: true, generation: 1 })),
    });
  });

  test('states each enabled pipeline as running or paused from one read of the runner', async () => {
    render(<PipelinesView initialPipelines={[pipeline(), PAUSED]} />);

    await waitFor(() => expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimePaused)).toBeTruthy());
    expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimeRunning)).toBeTruthy();
    expect(getPausedPipelines).toHaveBeenCalledOnce();
    expect(getRunnerPipelines).toHaveBeenCalledOnce();
  });

  // The runner is not driving a disabled pipeline at all, so "not running" would read as a fault where
  // there is a configuration.
  test('leaves a disabled pipeline without a runtime answer', async () => {
    render(<PipelinesView initialPipelines={[DISABLED]} />);

    await waitFor(() => expect(screen.getByText('cols:', { exact: false }).textContent).toContain('runtime'));
    const row = screen.getByLabelText('row-session-topic');
    expect(row.textContent).not.toContain(AnalyticsPipelinesI18nKey.RuntimeRunning);
    expect(row.textContent).not.toContain(AnalyticsPipelinesI18nKey.RuntimePaused);
  });

  // Enabled in the registry, absent from the runner: the row that used to look perfectly healthy.
  test('marks an enabled pipeline the runner did not take on', async () => {
    vi.mocked(getRunnerPipelines).mockResolvedValue({ success: true, response: [] });
    render(<PipelinesView initialPipelines={[pipeline()]} />);

    await waitFor(() => expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimeNotTracked)).toBeTruthy());
  });

  test('leaves an aggregate pipeline without a runtime answer', async () => {
    vi.mocked(getRunnerPipelines).mockResolvedValue({ success: true, response: [] });
    render(<PipelinesView initialPipelines={[pipeline({ name: 'sessions-rollup', kind: PipelineKind.Aggregate })]} />);

    await waitFor(() => expect(getRunnerPipelines).toHaveBeenCalled());
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeNotTracked)).toBeNull();
  });

  // An enrichment pipeline that declares no input is not one without a source — it reads whatever its
  // target enrichment reads, and an em dash said the opposite.
  test('states that an enrichment pipeline with no declared input follows its target', async () => {
    render(<PipelinesView initialPipelines={[pipeline({ inputs: undefined })]} />);

    const row = await screen.findByLabelText('row-turn-feedback-live');

    expect(row.textContent).toContain(AnalyticsPipelinesI18nKey.SourceFollowsTarget);
  });

  test('leaves the inputs cell empty for an aggregate pipeline that declares none', async () => {
    render(
      <PipelinesView
        initialPipelines={[pipeline({ name: 'sessions-rollup', kind: PipelineKind.Aggregate, inputs: undefined })]}
      />,
    );

    const row = await screen.findByLabelText('row-sessions-rollup');

    expect(row.textContent).not.toContain(AnalyticsPipelinesI18nKey.SourceFollowsTarget);
  });

  test('omits the column entirely when the runner could not be read', async () => {
    vi.mocked(getPausedPipelines).mockResolvedValue({ success: false });
    render(<PipelinesView initialPipelines={[pipeline()]} />);

    await waitFor(() => expect(getPausedPipelines).toHaveBeenCalled());
    expect(screen.getByText('cols:', { exact: false }).textContent).not.toContain('runtime');
  });

  test('omits the column and issues no read for a caller who is not a full admin', async () => {
    asFullAdmin(false);
    render(<PipelinesView initialPipelines={[pipeline()]} />);

    await waitFor(() => expect(screen.getByText('cols:', { exact: false })).toBeTruthy());
    expect(getPausedPipelines).not.toHaveBeenCalled();
    expect(getRunnerPipelines).not.toHaveBeenCalled();
    expect(screen.getByText('cols:', { exact: false }).textContent).not.toContain('runtime');
  });
});
