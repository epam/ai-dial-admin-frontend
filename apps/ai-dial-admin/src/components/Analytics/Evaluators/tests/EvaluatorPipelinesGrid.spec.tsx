import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EvaluatorPipelinesGrid from '@/src/components/Analytics/Evaluators/EvaluatorPipelinesGrid';
import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { PipelineListItem, TriggerKind, PipelineKind } from '@/src/models/analytics/pipeline';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

interface MockColDef {
  headerName?: string;
  field?: string;
  colId?: string;
  valueGetter?: (params: { data: PipelineListItem }) => unknown;
}

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    columnDefs,
    rowData,
    emptyDataProps,
    additionalGridOptions,
  }: {
    columnDefs?: MockColDef[];
    rowData?: PipelineListItem[];
    emptyDataProps?: { title?: string };
    additionalGridOptions?: { onCellClicked?: (e: { data?: PipelineListItem }) => void };
  }) => (
    <div>
      <div>cols: {columnDefs?.map((col) => col.colId ?? col.field).join('|')}</div>
      {rowData?.length === 0 && <div>{emptyDataProps?.title}</div>}
      {rowData?.map((row) => (
        <div key={row.name}>
          <button onClick={() => additionalGridOptions?.onCellClicked?.({ data: row })}>{`open ${row.name}`}</button>
          {columnDefs
            ?.map((col) => `${col.colId ?? col.field}=${String(col.valueGetter ? col.valueGetter({ data: row }) : '')}`)
            .join(' ')}
        </div>
      ))}
    </div>
  ),
}));

const rule = (over: Partial<PipelineListItem> = {}): PipelineListItem => ({
  name: 'insights-live',
  kind: PipelineKind.Enrich,
  evaluator_name: 'conversation-insights',
  evaluator_version: 2,
  target: 'conversation_insights',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  generation: 3,
  updated_at: '2026-08-21T09:37:29Z',
  ...over,
});

describe('EvaluatorPipelinesGrid', () => {
  beforeEach(() => {
    showNotification.mockClear();
  });

  test('renders the rule columns', () => {
    render(<EvaluatorPipelinesGrid pipelines={[rule()]} />);

    const cols = screen.getByText(/^cols:/).textContent ?? '';
    expect(cols).toContain('name');
    expect(cols).toContain('target_enrichment');
    expect(cols).toContain('trigger');
    expect(cols).toContain('resolvedVersion');
    expect(cols).toContain('enabled');
    expect(cols).toContain('updatedAt');
  });

  test('shows the pinned version as its number alone', () => {
    render(<EvaluatorPipelinesGrid pipelines={[rule({ evaluator_version: 2 })]} />);

    expect(screen.getByText(/resolvedVersion=2 /)).toBeTruthy();
  });

  test('reports a rule that declares no version as following the latest, which a listing never resolves', () => {
    render(<EvaluatorPipelinesGrid pipelines={[rule({ evaluator_version: undefined })]} />);

    expect(screen.getByText(/resolvedVersion=AnalyticsPipelines.Latest /)).toBeTruthy();
  });

  test('activating a row opens that pipeline', async () => {
    const user = userEvent.setup();
    render(<EvaluatorPipelinesGrid pipelines={[rule()]} />);

    await user.click(screen.getByRole('button', { name: 'open insights-live' }));

    expect(push).toHaveBeenCalledWith('/pipelines/insights-live');
  });

  test('states that no pipeline references the evaluator', () => {
    render(<EvaluatorPipelinesGrid pipelines={[]} />);

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.UsedByNone)).toBeTruthy();
  });

  test('states the list as unavailable rather than claiming none reference it', () => {
    render(<EvaluatorPipelinesGrid pipelines={null} />);

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.UsedByUnavailable)).toBeTruthy();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.UsedByNone)).toBeNull();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.UsedByLoadFailed)).toBeNull();
  });

  test('raises no notification of its own', () => {
    render(<EvaluatorPipelinesGrid pipelines={null} />);

    expect(showNotification).not.toHaveBeenCalled();
  });
});
