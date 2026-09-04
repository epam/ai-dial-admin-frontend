import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import EvaluatorPipelinesGrid from '@/src/components/Analytics/Evaluators/EvaluatorPipelinesGrid';
import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { PipelineListItem, TriggerKind, PipelineKind } from '@/src/models/analytics/pipeline';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

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
  evaluator: { name: 'conversation-insights', version: 2, type: EvaluatorType.Llm },
  target: 'conversation_insights',
  grain_key: 'conversation_id',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  generation: 3,
  updated_at: '2026-08-21T09:37:29Z',
  ...over,
});

describe('EvaluatorPipelinesGrid', () => {
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

  test('marks a rule that declares no version as tracking the latest', () => {
    render(
      <EvaluatorPipelinesGrid
        pipelines={[
          rule({
            evaluator_version: undefined,
            evaluator: { name: 'conversation-insights', version: 4, type: EvaluatorType.Llm },
          }),
        ]}
      />,
    );

    expect(screen.getByText(/resolvedVersion=4 · /)).toBeTruthy();
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

  test('reports a failed listing rather than claiming none reference it', () => {
    render(<EvaluatorPipelinesGrid pipelines={null} />);

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.UsedByLoadFailed)).toBeTruthy();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.UsedByNone)).toBeNull();
  });
});
