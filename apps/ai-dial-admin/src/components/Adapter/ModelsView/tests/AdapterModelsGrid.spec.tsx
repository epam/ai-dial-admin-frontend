import { render } from '@testing-library/react';
import { ColDef } from 'ag-grid-community';
import { afterEach, describe, expect, test, vi } from 'vitest';

import AdapterModelsGrid from '@/src/components/Adapter/ModelsView/AdapterModelsGrid';
import DisplayNameCellRenderer from '@/src/components/Grid/CellRenderers/DisplayNameCellRenderer';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { DialModel } from '@/src/models/dial/model';

const { gridProps } = vi.hoisted(() => ({ gridProps: { columnDefs: [] as ColDef[] } }));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: { columnDefs: ColDef[] }) => {
    gridProps.columnDefs = props.columnDefs;
    return null;
  },
}));

const MODEL = { name: 'gpt-4', displayName: 'GPT-4' } as DialModel;

describe('AdapterModelsGrid', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('links the model name to its details page in a new tab', () => {
    render(<AdapterModelsGrid models={[MODEL]} />);

    const nameColumn = gridProps.columnDefs.find((column) => column.cellRenderer === DisplayNameCellRenderer);
    const params = nameColumn?.cellRendererParams as { getHref: (row: unknown) => string; isNewTab: boolean };

    expect(params.isNewTab).toBe(true);
    expect(params.getHref(MODEL)).toBe('/models/gpt-4');
  });

  test('opens the model, not an empty path, from the row action', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<AdapterModelsGrid models={[MODEL]} />);

    const actionColumn = gridProps.columnDefs.find((column) => column.field === ACTIONS_COLUMN_CEL_ID);
    const [openItem] = (actionColumn?.cellRendererParams as { items: { onClick: (row?: DialModel) => void }[] }).items;
    openItem.onClick(MODEL);

    expect(openSpy).toHaveBeenCalledWith('/models/gpt-4', '_blank');
  });
});
