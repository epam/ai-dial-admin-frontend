import { render, screen } from '@testing-library/react';
import AdaptersList from './AdaptersList';
import { ColDef } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/app/[lang]/adapters/actions', () => ({
  createAdapter: vi.fn(),
  removeAdapter: vi.fn(),
}));

vi.mock('@/src/components/EntityListView/EntityListView', () => {
  return {
    __esModule: true,
    default: (props: { names: string[]; route: string; baseColumns: ColDef[] }) => (
      <div>
        <div>BaseEntityListMock</div>
        <div>{props.names && props.names.join(',')}</div>
        <div>{props.route}</div>
        <div>{props.baseColumns.map((c) => c.headerName).join(',')}</div>
      </div>
    ),
  };
});

vi.mock('@/src/constants/grid-columns/grid-columns', () => {
  return {
    SIMPLE_DESCRIPTION_COLUMNS: [
      { field: 'id', headerName: 'ID' },
      { field: 'name', headerName: 'Name' },
    ],
    listViewTitleMap: { '/adapters': 'Adapters Title' },
    emptyDataTitleMap: { '/adapters': '' },
    createModalTitleMap: { '/adapters': 'Adapters Title' },
  };
});

describe('AdaptersList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [{ id: '1', name: 'Adapter One' }, { id: '2', name: 'Adapter Two' }, { id: '3' }];
    render(<AdaptersList data={data} />);
    expect(screen.getByText('BaseEntityListMock')).toBeInTheDocument();
    expect(screen.getByText('Adapter One,Adapter Two,')).toBeInTheDocument();
    expect(screen.getByText('/adapters')).toBeInTheDocument();
    expect(screen.getByText('ID,Name')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<AdaptersList data={[]} />);
    expect(screen.getByText('BaseEntityListMock')).toBeInTheDocument();
    expect(screen.getByText('/adapters')).toBeInTheDocument();
  });
});
