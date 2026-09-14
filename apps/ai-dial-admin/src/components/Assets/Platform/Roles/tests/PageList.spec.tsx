import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileRoles } from '@/src/app/[lang]/platform-roles/actions';
import PlatformRolesPageList from '../PageList';

vi.mock('@/src/app/[lang]/platform-roles/actions', () => ({ getConfigFileRoles: vi.fn() }));
vi.mock('@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList', () => ({
  default: ({ names, route }: { names: string[]; route: string }) => (
    <div>
      config-file-roles:{names.length}:{route}
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

  test('renders the shared config-file list, for the Roles route, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileRoles).mockResolvedValue({
      success: true,
      data: ['r1'],
    });

    render(<PlatformRolesPageList />);

    expect(await screen.findByText('config-file-roles:1:/platform-roles')).toBeTruthy();
  });
});
