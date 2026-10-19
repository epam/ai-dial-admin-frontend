import { render, screen } from '@testing-library/react';
import { ColDef, IDatasource, ModelUpdatedEvent } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import BreakdownGrid from '@/src/components/Analytics/Usage/Breakdown/BreakdownGrid';
import { BreakdownRowModel } from '@/src/components/Analytics/Usage/models';

interface CapturedGrid {
  additionalGridOptions: {
    rowHeight?: number;
    onModelUpdated: (event: ModelUpdatedEvent<BreakdownRowModel>) => void;
  };
}

const grids: CapturedGrid[] = [];

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: CapturedGrid) => {
    grids.push(props);

    return <div role="grid" />;
  },
}));

const row = (id: string, calls: number): BreakdownRowModel => ({ id, calls }) as BreakdownRowModel;

const COLUMNS: ColDef<BreakdownRowModel>[] = [
  { colId: 'dimension', field: 'displayLabel' },
  { colId: 'calls', cellRendererParams: { format: (r: BreakdownRowModel) => r.calls.toLocaleString('en-US') } },
];

const DATASOURCE: IDatasource = { getRows: vi.fn() };

type Props = Parameters<typeof BreakdownGrid>[0];

const renderGrid = (props: Partial<Props> = {}) =>
  render(<BreakdownGrid rows={[]} columnDefs={COLUMNS} isLoading={false} hasFailed={false} {...props} />);

const lastGrid = () => grids[grids.length - 1];

const updateModel = (rows: BreakdownRowModel[]) =>
  lastGrid().additionalGridOptions.onModelUpdated({
    api: {
      forEachNode: (visit: (node: { data?: BreakdownRowModel }) => void) => rows.forEach((data) => visit({ data })),
    },
  } as unknown as ModelUpdatedEvent<BreakdownRowModel>);

const ruler = (colId: string) =>
  (screen.getByRole('grid').parentElement as HTMLElement).style.getPropertyValue(`--breakdown-figure-ruler-${colId}`);

describe('BreakdownGrid', () => {
  beforeEach(() => {
    grids.length = 0;
  });

  test('draws its rows 40px tall', () => {
    renderGrid();

    expect(lastGrid().additionalGridOptions.rowHeight).toBe(40);
  });

  test('publishes the widest figure of each measure column once the rows are in', () => {
    renderGrid();

    updateModel([row('a', 7), row('b', 51482)]);

    expect(ruler('calls')).toBe('"51,482"');
  });

  test('publishes nothing for a column that states no figure', () => {
    renderGrid();

    updateModel([row('a', 7)]);

    expect(ruler('dimension')).toBe('');
  });

  test('measures the card afresh when its rows change, so a narrower window narrows it', () => {
    renderGrid();

    updateModel([row('a', 51482)]);
    updateModel([row('a', 7)]);

    expect(ruler('calls')).toBe('"7"');
  });

  test('never narrows the paged list as blocks arrive, so its figures hold still', () => {
    renderGrid({ datasource: DATASOURCE, datasourceKey: 'llm|models' });

    updateModel([row('a', 51482)]);
    updateModel([row('a', 51482), row('b', 7)]);

    expect(ruler('calls')).toBe('"51,482"');
  });

  test('measures the paged list afresh when it becomes a different list', () => {
    const { rerender } = renderGrid({ datasource: DATASOURCE, datasourceKey: 'llm|models' });

    updateModel([row('a', 51482)]);
    rerender(
      <BreakdownGrid
        rows={[]}
        columnDefs={COLUMNS}
        isLoading={false}
        hasFailed={false}
        datasource={DATASOURCE}
        datasourceKey="llm|models|gpt"
      />,
    );
    updateModel([row('a', 7)]);

    expect(ruler('calls')).toBe('"7"');
  });
});
