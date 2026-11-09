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

const renderGrid = (components?: GridOptions['components'], isRadioInNameColumn?: boolean) =>
  render(
    <RadioSelectGrid<Row>
      data={[{ id: '1' }]}
      columnDefs={COLUMN_DEFS}
      idField="id"
      emptyTitle="empty"
      onSelect={vi.fn()}
      components={components}
      isRadioInNameColumn={isRadioInNameColumn}
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

  test('keeps a separate radio selection column by default', () => {
    renderGrid();

    expect(capturedGridProps?.additionalGridOptions?.selectionColumnDef?.cellRenderer).toBeDefined();
  });

  test('drops the selection column when the radio lives in the name column', () => {
    renderGrid(undefined, true);

    const options = capturedGridProps?.additionalGridOptions;

    expect(options?.selectionColumnDef).toBeUndefined();
    expect(options?.rowSelection).toMatchObject({ mode: 'singleRow', checkboxes: false });
  });

  test('refreshes the row and reports the selection when a name-column radio is picked', () => {
    const onSelect = vi.fn();
    render(
      <RadioSelectGrid<Row>
        data={[{ id: '1' }]}
        columnDefs={COLUMN_DEFS}
        idField="id"
        emptyTitle="empty"
        onSelect={onSelect}
        isRadioInNameColumn
      />,
    );
    const refreshCells = vi.fn();
    const node = { isSelected: () => true };

    capturedGridProps?.additionalGridOptions?.onRowSelected?.({
      api: { refreshCells },
      node,
      data: { id: '1' },
    } as never);

    expect(refreshCells).toHaveBeenCalledWith({ rowNodes: [node], force: true });
    expect(onSelect).toHaveBeenCalledWith({ id: '1' });
  });
});
