import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DialRoleResource } from '@/src/models/dial/resource';
import { PlatformSharingType } from '../models';
import RoleSharing from '../Sharing';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

interface MockColDef {
  field?: string;
  valueFormatter?: (params: { value: string }) => string;
  cellRendererParams?: { getDefaultPlaceholder?: (node: unknown, colDef: unknown) => string };
}

interface MockRow {
  name: PlatformSharingType;
  invitationTtl?: string;
  maxAcceptedUsers?: string;
}

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ onGridReady }: { onGridReady: (event: unknown) => void }) => {
    let rowData: MockRow[] = [];
    let columnDefs: MockColDef[] = [];
    onGridReady({
      api: {
        updateGridOptions: (options: { rowData?: MockRow[]; columnDefs?: MockColDef[] }) => {
          rowData = options.rowData ?? rowData;
          columnDefs = options.columnDefs ?? columnDefs;
        },
        isDestroyed: () => false,
        refreshCells: () => {},
      },
    });

    const typeColumn = columnDefs.find((c) => c.field === 'name');
    const maxUsersColumn = columnDefs.find((c) => c.field === 'maxAcceptedUsers');
    const ttlColumn = columnDefs.find((c) => c.field === 'invitationTtl');

    return (
      <div>
        <div>rows: {rowData.length}</div>
        <div>types: {rowData.map((row) => typeColumn?.valueFormatter?.({ value: row.name })).join('|')}</div>
        {rowData.map((row) => (
          <div key={row.name}>
            <span>
              {row.name}:maxUsersPlaceholder=
              {row.maxAcceptedUsers ??
                maxUsersColumn?.cellRendererParams?.getDefaultPlaceholder?.(
                  { data: row },
                  { field: 'maxAcceptedUsers' },
                )}
            </span>
            <span>
              {row.name}:invitationTtlPlaceholder=
              {row.invitationTtl ??
                ttlColumn?.cellRendererParams?.getDefaultPlaceholder?.({ data: row }, { field: 'invitationTtl' })}
            </span>
          </div>
        ))}
      </div>
    );
  },
}));

const role = (overrides: Partial<DialRoleResource> = {}): DialRoleResource =>
  ({ name: 'my-role', path: 'my-role', folderId: '', ...overrides }) as DialRoleResource;

describe('RoleSharing', () => {
  test('lists all seven sharing types, including Credentials and Skills', () => {
    render(<RoleSharing selectedRole={role()} onChangeRole={vi.fn()} isSkipRefresh={false} />);

    expect(screen.getByText('rows: 7')).toBeTruthy();
    expect(screen.getByText(/Menu\.Credentials/)).toBeTruthy();
    expect(screen.getByText(/Menu\.Skills/)).toBeTruthy();
  });

  test("shows the toolset row's max-users placeholder as 10, same as applications", () => {
    render(<RoleSharing selectedRole={role()} onChangeRole={vi.fn()} isSkipRefresh={false} />);

    expect(screen.getByText(`${PlatformSharingType.TOOL_SET}:maxUsersPlaceholder=10`)).toBeTruthy();
    expect(screen.getByText(`${PlatformSharingType.APPLICATION}:maxUsersPlaceholder=10`)).toBeTruthy();
  });

  test('renders a stored -1 as empty, falling through to the default placeholder, not as a literal -1', () => {
    render(
      <RoleSharing
        selectedRole={role({
          share: { [PlatformSharingType.TOOL_SET]: { max_accepted_users: -1, invitation_ttl: -1 } },
        })}
        onChangeRole={vi.fn()}
        isSkipRefresh={false}
      />,
    );

    expect(screen.getByText(`${PlatformSharingType.TOOL_SET}:maxUsersPlaceholder=10`)).toBeTruthy();
    expect(screen.getByText(`${PlatformSharingType.TOOL_SET}:invitationTtlPlaceholder=72`)).toBeTruthy();
  });
});
