import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileRoles } from '@/src/app/[lang]/platform-roles/actions';
import PlatformRolesPageList from '../PageList';

vi.mock('@/src/app/[lang]/platform-roles/actions', () => ({ getConfigFileRoles: vi.fn() }));
vi.mock('@/src/components/Roles/List/List', () => ({
  default: ({ data, isConfigFileSource }: { data: unknown[]; isConfigFileSource?: boolean }) => (
    <div>
      admin-grid-roles:{data.length}:{String(isConfigFileSource)}
    </div>
  ),
}));
vi.mock('../List', () => ({ default: () => <div>asset-roles-list</div> }));

const mockContext = { showConfigFiles: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ showConfigFiles: mockContext.showConfigFiles }),
}));

describe('PlatformRolesPageList', () => {
  test('renders the asset list and issues no config-file fetch by default', () => {
    mockContext.showConfigFiles = false;

    render(<PlatformRolesPageList />);

    expect(screen.getByText('asset-roles-list')).toBeTruthy();
    expect(getConfigFileRoles).not.toHaveBeenCalled();
  });

  test('renders the admin-grid list, marked as config-file-sourced, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileRoles).mockResolvedValue({
      success: true,
      data: { entities: [{ name: 'r1' } as any], failures: [] },
    });

    render(<PlatformRolesPageList />);

    expect(await screen.findByText('admin-grid-roles:1:true')).toBeTruthy();
  });
});
