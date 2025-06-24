import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import { ColDef } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';
import AddonsList from './AddonsList';

vi.mock('@/src/app/[lang]/addons/actions', () => ({
  createAddon: vi.fn(),
  removeAddon: vi.fn(),
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
    ENTITY_WITH_VERSION_COLUMNS: () => mockColumns,
    ENTITIES_COLUMNS: () => mockColumns,
    listViewTitleMap: { '/addons': 'Addons Title' },
    emptyDataTitleMap: { '/addons': '' },
    createModalTitleMap: { '/addons': 'Addons Title' },
  };
});

describe('AddonsList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [
      { id: '1', displayName: 'Addon One', version: '1.0' },
      { id: '2', displayName: 'Addon Two', version: '2.0' },
      { id: '3', version: '3.0' },
    ];
    render(<AddonsList data={data} />);
    expect(screen.getByText('BaseEntityListMock')).toBeInTheDocument();
    expect(screen.getByText('Addon One,Addon Two,')).toBeInTheDocument();
    expect(screen.getByText(ApplicationRoute.Addons)).toBeInTheDocument();
    expect(screen.getByText('ID,Name,Version')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<AddonsList data={[]} />);
    expect(screen.getByText('BaseEntityListMock')).toBeInTheDocument();
    expect(screen.getByText('/addons')).toBeInTheDocument();
  });
});
