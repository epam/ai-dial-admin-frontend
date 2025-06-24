import { render, screen } from '@testing-library/react';
import { ColDef } from 'ag-grid-community';
import AssistantsList from './AssistantsList';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/app/[lang]/assistants/actions', () => ({
  createAssistant: vi.fn(),
  removeAssistant: vi.fn(),
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
    listViewTitleMap: { '/assistants': 'Assistants Title' },
    emptyDataTitleMap: { '/assistants': '' },
    createModalTitleMap: { '/assistants': 'Assistants Title' },
  };
});

describe('AssistantsList', () => {
  test('renders BaseEntityList with correct props', () => {
    const data = [
      { id: '1', displayName: 'Assistant One', version: '1.0' },
      { id: '2', displayName: 'Assistant Two', version: '2.0' },
      { id: '3', version: '3.0' },
    ];
    render(<AssistantsList data={data} />);
    expect(screen.getByText('BaseEntityListMock')).toBeInTheDocument();
    expect(screen.getByText('Assistant One,Assistant Two,')).toBeInTheDocument();
    expect(screen.getByText('/assistants')).toBeInTheDocument();
    expect(screen.getByText('ID,Name,Version')).toBeInTheDocument();
  });

  test('renders with empty data', () => {
    render(<AssistantsList data={[]} />);
    expect(screen.getByText('BaseEntityListMock')).toBeInTheDocument();
    expect(screen.getByText('/assistants')).toBeInTheDocument();
  });
});
