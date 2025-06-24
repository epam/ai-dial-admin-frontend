import { render, screen } from '@testing-library/react';
import ApplicationsList from './ApplicationsList';
import { ColDef } from 'ag-grid-community';
import { DialApplicationScheme } from '../../models/dial/application';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/app/[lang]/applications/actions', () => ({
  createApplication: vi.fn(),
  removeApplication: vi.fn(),
}));

vi.mock('@/src/components/EntityListView/EntityListView', () => {
  return {
    __esModule: true,
    default: (props: { names: string[]; runners: DialApplicationScheme[]; route: string; baseColumns: ColDef[] }) => (
      <div>
        <div>BaseEntityListMock</div>
        <div>{props.names && props.names.join(',')}</div>
        <div>{props.route}</div>
        <div>{props.baseColumns.map((c) => c.headerName).join(',')}</div>
        <div>{props.runners && props.runners.map((r) => r['dial:applicationTypeDisplayName']).join(',')}</div>
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
    ENTITY_WITH_VERSION_COLUMNS: () => mockColumns,
    ENTITIES_COLUMNS: () => mockColumns,
    listViewTitleMap: { '/applications': 'Applications Title' },
    emptyDataTitleMap: { '/applications': '' },
    createModalTitleMap: { '/applications': 'Applications Title' },
  };
});

describe('ApplicationsList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [
      { id: '1', displayName: 'App One', version: '1.0' },
      { id: '2', displayName: 'App Two', version: '2.0' },
      { id: '3', version: '3.0' },
    ];
    const runners: DialApplicationScheme[] = [
      { $id: 'r1', 'dial:applicationTypeDisplayName': 'Runner One' },
      { $id: 'r2', 'dial:applicationTypeDisplayName': 'Runner Two' },
    ];
    render(<ApplicationsList data={data} runners={runners} />);
    expect(screen.getByText('BaseEntityListMock')).toBeInTheDocument();
    expect(screen.getByText('App One,App Two,')).toBeInTheDocument();
    expect(screen.getByText('/applications')).toBeInTheDocument();
    expect(screen.getByText('ID,Name,Version')).toBeInTheDocument();
    expect(screen.getByText('Runner One,Runner Two')).toBeInTheDocument();
  });

  test('renders with empty data and runners', () => {
    render(<ApplicationsList data={[]} runners={[]} />);
    expect(screen.getByText('BaseEntityListMock')).toBeInTheDocument();
    expect(screen.getByText('/applications')).toBeInTheDocument();
  });
});
