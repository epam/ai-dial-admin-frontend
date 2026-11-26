import { ComponentProps } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColDef, GetRowIdParams, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EvaluatedKeyCell from '@/src/components/Analytics/Pipelines/Preview/EvaluatedKeyCell';
import PreviewGrid from '@/src/components/Analytics/Pipelines/Preview/PreviewGrid';
import PreviewColumnHeader from '@/src/components/Analytics/Pipelines/Preview/PreviewColumnHeader';
import { columnMock, evaluationMock } from '@/src/components/Analytics/Pipelines/Preview/tests/mock';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { DlqStage } from '@/src/models/analytics/pipeline-dlq';
import { ModelRunStatus } from '@/src/models/analytics/pipeline-model-run';
import { PreviewColumnRole } from '@/src/models/analytics/pipeline-preview';

const gridView = vi.hoisted(() => vi.fn((_props: unknown) => null));

// The grid itself is the library's; what is worth proving here is what this component hands it.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({ default: gridView }));

interface GridRow {
  index: number;
  values: Record<string, unknown>;
}

interface GridProps {
  columnDefs: ColDef[];
  rowData: GridRow[];
  getRowId: (params: GetRowIdParams<GridRow>) => string;
  isLiveData: boolean;
  additionalGridOptions: { headerHeight: number; rowHeight: number; suppressNoRowsOverlay: boolean };
}

const renderGrid = (columns = [columnMock()], rows: Record<string, unknown>[] = []) => {
  render(<PreviewGrid columns={columns} rows={rows} />);

  return gridView.mock.calls.at(-1)![0] as GridProps;
};

const formatted = (def: ColDef, value: unknown) =>
  (def.valueFormatter as (params: ValueFormatterParams) => string)({ value } as ValueFormatterParams);

describe('PreviewGrid', () => {
  beforeEach(() => {
    gridView.mockClear();
  });

  test('draws one column per entry the service returned, in its order', () => {
    const { columnDefs } = renderGrid([
      columnMock({ name: 'event_id' }),
      columnMock({ name: 'cost_tier', role: PreviewColumnRole.Output }),
      columnMock({ name: 'prompt_tokens_k', role: PreviewColumnRole.Output }),
    ]);

    expect(columnDefs.map((def) => def.colId)).toEqual(['event_id', 'cost_tier', 'prompt_tokens_k']);
    expect(columnDefs.map((def) => def.headerName)).toEqual(['event_id', 'cost_tier', 'prompt_tokens_k']);
  });

  test('hands the rows through in order, each with the place it came in', () => {
    const rows = [{ event_id: 'a1' }, { event_id: 'b2' }];

    expect(renderGrid([columnMock()], rows).rowData).toEqual([
      { index: 0, values: rows[0] },
      { index: 1, values: rows[1] },
    ]);
  });

  // The grid identifies a row by its content unless told otherwise: five members of one group that read the same in
  // the few columns the sample carries came out as the distinct ones.
  test('gives rows that read identically an id each, so none is collapsed into another', () => {
    const same = { deployment: 'gemini-3.5-flash', event_kind: 'llm_call' };
    const { rowData, getRowId, isLiveData } = renderGrid([columnMock()], [same, { ...same }, { ...same }]);

    const ids = rowData.map((row) => getRowId({ data: row } as GetRowIdParams<GridRow>));

    expect(new Set(ids).size).toBe(3);
    expect(isLiveData).toBe(true);
  });

  test('gives each column its own header with the column it describes', () => {
    const column = columnMock({ name: 'cost_tier', role: PreviewColumnRole.Output, max_bytes: 4 });
    const [def] = renderGrid([column]).columnDefs;

    expect(def.headerComponent).toBe(PreviewColumnHeader);
    expect(def.headerComponentParams).toEqual({ previewColumn: column });
  });

  test('reads a column by its literal name, so an enrichment column is not taken for a nested path', () => {
    const [def] = renderGrid([columnMock({ name: 'usage_client_identity.client_type' })]).columnDefs;
    const valueGetter = def.valueGetter as (params: ValueGetterParams) => unknown;

    expect(
      valueGetter({
        data: { index: 0, values: { 'usage_client_identity.client_type': 'web' } },
      } as unknown as ValueGetterParams),
    ).toBe('web');
  });

  test('shows a null value as NULL rather than a blank cell', () => {
    const [def] = renderGrid().columnDefs;

    expect(formatted(def, null)).toBe(PipelinePreviewI18nKey.CellNull);
    expect(formatted(def, undefined)).toBe(PipelinePreviewI18nKey.CellNull);
  });

  test('shows a value of every other kind as text, a non-string one as compact JSON', () => {
    const [def] = renderGrid().columnDefs;

    expect(formatted(def, 0)).toBe('0');
    expect(formatted(def, false)).toBe('false');
    expect(formatted(def, ['a', 'b'])).toBe('["a","b"]');
    expect(formatted(def, { a: 1 })).toBe('{"a":1}');
  });

  test('keeps the column headers of an empty sample, with no no-rows overlay', () => {
    const { columnDefs, additionalGridOptions } = renderGrid([columnMock()], []);

    expect(columnDefs).toHaveLength(1);
    expect(additionalGridOptions.suppressNoRowsOverlay).toBe(true);
  });

  test('turns off sorting and filtering, which a few rows in the service order do not want', () => {
    const [def] = renderGrid().columnDefs;

    expect(def).toMatchObject({ sortable: false, filter: false, floatingFilter: false });
  });

  test('draws a compact header, tall enough for the name over the role and type, and compact rows', () => {
    const { additionalGridOptions } = renderGrid();

    expect(additionalGridOptions.headerHeight).toBeGreaterThan(40);
    expect(additionalGridOptions.headerHeight).toBeLessThan(64);
    expect(additionalGridOptions.rowHeight).toBeLessThanOrEqual(40);
  });
});

describe('PreviewGrid — a model run', () => {
  const onTogglePanel = vi.fn();

  const renderModelGrid = (evaluation = evaluationMock({ grain_key: 'b2' })) => {
    render(
      <PreviewGrid
        columns={[columnMock(), columnMock({ name: 'body', role: PreviewColumnRole.Input })]}
        rows={[{ event_id: 'a1' }, { event_id: 'b2' }]}
        modelRun={{ evaluation, evaluatedIndex: 1, isPanelExpanded: true, onTogglePanel }}
      />,
    );

    return gridView.mock.calls.at(-1)![0] as GridProps;
  };

  const valueOf = (def: ColDef, index: number) =>
    (def.valueGetter as (params: ValueGetterParams) => unknown)({
      data: { index, values: {} },
    } as ValueGetterParams);

  const formattedFor = (def: ColDef, index: number, value: unknown) =>
    (def.valueFormatter as (params: ValueFormatterParams) => string)({
      value,
      data: { index, values: {} },
    } as ValueFormatterParams);

  beforeEach(() => {
    gridView.mockClear();
  });

  test('leads with the outcome column and ends with one column per mapped output', () => {
    const { columnDefs } = renderModelGrid();

    expect(columnDefs.map((def) => def.colId)).toEqual([
      '__model_outcome',
      'event_id',
      'body',
      '__model_output_sentiment',
      '__model_output_topic',
    ]);
  });

  test('marks the evaluated row and reads the others as preview only', () => {
    const [outcome] = renderModelGrid().columnDefs;

    expect(valueOf(outcome, 1)).toBe(PipelinePreviewI18nKey.CellOk);
    expect(valueOf(outcome, 0)).toBe(PipelinePreviewI18nKey.CellPreviewOnly);
  });

  test('names the failed stage on the evaluated row', () => {
    const [outcome] = renderModelGrid(
      evaluationMock({ grain_key: 'b2', status: ModelRunStatus.Failed, stage: DlqStage.Validate }),
    ).columnDefs;

    expect(valueOf(outcome, 1)).toBe(PipelinePreviewI18nKey.CellFailed);
  });

  test('carries mapped values on the evaluated row only', () => {
    const sentiment = renderModelGrid().columnDefs[3];

    expect(valueOf(sentiment, 1)).toBe('negative');
    expect(formattedFor(sentiment, 0, undefined)).toBe('—');
  });

  test('renders the grain key as the panel toggle', () => {
    const grain = renderModelGrid().columnDefs[1];

    expect(grain.cellRenderer).toBe(EvaluatedKeyCell);
    expect(grain.cellRendererParams).toEqual({ evaluatedIndex: 1, isPanelExpanded: true, onTogglePanel });
  });
});

describe('EvaluatedKeyCell', () => {
  test('is a toggle for the evaluated row only', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const propsFor = (index: number) =>
      ({
        valueFormatted: 'b2',
        data: { index, values: {} },
        evaluatedIndex: 1,
        isPanelExpanded: false,
        onTogglePanel: onToggle,
      }) as unknown as ComponentProps<typeof EvaluatedKeyCell>;

    const { rerender } = render(<EvaluatedKeyCell {...propsFor(0)} />);
    expect(screen.queryByRole('button')).toBeNull();

    rerender(<EvaluatedKeyCell {...propsFor(1)} />);
    const toggle = screen.getByRole('button', { name: 'b2' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(onToggle).toHaveBeenCalledOnce();
  });
});

describe('PreviewGrid — a model run without a stage', () => {
  beforeEach(() => {
    gridView.mockClear();
  });

  test('names an unknown stage rather than leaving it blank', () => {
    render(
      <PreviewGrid
        columns={[columnMock()]}
        rows={[{ event_id: 'a1' }]}
        modelRun={{
          evaluation: evaluationMock({ status: ModelRunStatus.Failed, stage: undefined }),
          evaluatedIndex: 0,
          isPanelExpanded: true,
          onTogglePanel: vi.fn(),
        }}
      />,
    );
    const [outcome] = (gridView.mock.calls.at(-1)![0] as GridProps).columnDefs;
    const getter = outcome.valueGetter as (params: ValueGetterParams) => unknown;

    expect(getter({ data: { index: 0, values: {} } } as ValueGetterParams)).toBe(PipelinePreviewI18nKey.CellFailed);
  });
});
