import { render } from '@testing-library/react';
import { ColDef, GridOptions } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import RadioSelectGrid from '@/src/components/Grid/GridView/RadioSelectGrid';

interface GridViewProps {
  additionalGridOptions?: GridOptions;
}

let capturedGridProps: GridViewProps | undefined;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: GridViewProps) => {
    capturedGridProps = props;
    return <section aria-label="radio-select-grid" />;
  },
}));

interface Row {
  id: string;
}

const COLUMN_DEFS: ColDef[] = [{ field: 'id' }];

const renderGrid = (components?: GridOptions['components']) =>
  render(
    <RadioSelectGrid<Row>
      data={[{ id: '1' }]}
      columnDefs={COLUMN_DEFS}
      idField="id"
      emptyTitle="empty"
      onSelect={vi.fn()}
      components={components}
    />,
  );

describe('RadioSelectGrid', () => {
  test('passes a given components map through to the grid', () => {
    const components = { customFilter: vi.fn() };

    renderGrid(components);

    expect(capturedGridProps?.additionalGridOptions?.components).toBe(components);
  });

  test('renders with no components map when the caller supplies none', () => {
    renderGrid();

    expect(capturedGridProps?.additionalGridOptions?.components).toBeUndefined();
  });
});
