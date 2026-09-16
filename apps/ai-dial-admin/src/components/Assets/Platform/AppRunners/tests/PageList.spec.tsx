import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileAppRunners } from '@/src/app/[lang]/platform-app-runners/actions';
import PlatformAppRunnersPageList from '../PageList';

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({ getConfigFileAppRunners: vi.fn() }));
vi.mock('@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList', () => ({
  default: ({ names, route }: { names: string[]; route: string }) => (
    <div>
      config-file-app-runners:{names.length}:{route}
    </div>
  ),
}));
vi.mock('../List', () => ({ default: () => <div>asset-app-runners-list</div> }));

const mockContext = { showConfigFiles: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ showConfigFiles: mockContext.showConfigFiles }),
}));

describe('PlatformAppRunnersPageList', () => {
  test('renders the asset list and issues no config-file fetch by default', () => {
    mockContext.showConfigFiles = false;

    render(<PlatformAppRunnersPageList />);

    expect(screen.getByText('asset-app-runners-list')).toBeTruthy();
    expect(getConfigFileAppRunners).not.toHaveBeenCalled();
  });

  test('renders the shared config-file list, for the ApplicationRunners route, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileAppRunners).mockResolvedValue({
      success: true,
      data: ['runner-1'],
    });

    render(<PlatformAppRunnersPageList />);

    expect(await screen.findByText('config-file-app-runners:1:/platform-app-runners')).toBeTruthy();
  });
});
