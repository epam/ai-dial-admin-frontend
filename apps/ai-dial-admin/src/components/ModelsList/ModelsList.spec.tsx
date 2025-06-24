import { render, screen } from '@testing-library/react';
import ModelsList from './ModelsList';
import { ColDef } from 'ag-grid-community';
import { DialAdapter } from '../../models/dial/adapter';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/app/[lang]/models/actions', () => ({
  createModel: vi.fn(),
  removeModel: vi.fn(),
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
  const mockColumns = [
    { field: 'id', headerName: 'ID' },
    { field: 'displayName', headerName: 'Name' },
    { field: 'type', headerName: 'Type' },
    { field: 'version', headerName: 'Version' },
  ];
  return {
    ENTITY_WITH_VERSION_COLUMNS: (t: (str: string) => string, adapters: DialAdapter[]) => [
      { field: 'id', headerName: 'ID' },
      { field: 'displayName', headerName: 'Name' },
      { field: 'type', headerName: 'Type' },
      { field: 'version', headerName: 'Version' },
      ...(adapters ? adapters.map((a) => ({ field: a.name, headerName: a.name })) : []),
    ],
    listViewTitleMap: { '/models': 'Models Title' },
    ENTITIES_COLUMNS: () => mockColumns,
    emptyDataTitleMap: { '/models': '' },
    createModalTitleMap: { '/models': 'ModelsF Title' },
  };
});

describe('ModelsList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [
      { id: '1', displayName: 'Model One', version: '1.0' },
      { id: '2', displayName: 'Model Two', version: '2.0' },
      { id: '3', version: '3.0' },
    ];
    const adapters = [
      { id: 'a1', name: 'Adapter One' },
      { id: 'a2', name: 'Adapter Two' },
    ];
    render(<ModelsList data={data} adapters={adapters} />);
    expect(screen.getByText('BaseEntityListMock')).toBeInTheDocument();
    expect(screen.getByText('Model One,Model Two,')).toBeInTheDocument();
    expect(screen.getByText('/models')).toBeInTheDocument();
    expect(screen.getByText('ID,Name,Type,Version,Adapter One,Adapter Two')).toBeInTheDocument();
  });

  test('renders with empty data and adapters', () => {
    render(<ModelsList data={[]} adapters={[]} />);
    expect(screen.getByText('BaseEntityListMock')).toBeInTheDocument();
    expect(screen.getByText('/models')).toBeInTheDocument();
  });
});
