import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileRoutes } from '@/src/app/[lang]/platform-routes/actions';
import PlatformRoutesPageList from '../PageList';

vi.mock('@/src/app/[lang]/platform-routes/actions', () => ({ getConfigFileRoutes: vi.fn() }));
vi.mock('@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList', () => ({
  default: ({ names, route }: { names: string[]; route: string }) => (
    <div>
      config-file-routes:{names.length}:{route}
    </div>
  ),
}));
vi.mock('../List', () => ({ default: () => <div>asset-routes-list</div> }));

const mockContext = { showConfigFiles: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ showConfigFiles: mockContext.showConfigFiles }),
}));

describe('PlatformRoutesPageList', () => {
  test('renders the asset list and issues no config-file fetch by default', () => {
    mockContext.showConfigFiles = false;

    render(<PlatformRoutesPageList />);

    expect(screen.getByText('asset-routes-list')).toBeTruthy();
    expect(getConfigFileRoutes).not.toHaveBeenCalled();
  });

  test('renders the shared config-file list, for the Routes route, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileRoutes).mockResolvedValue({
      success: true,
      data: ['r1'],
    });

    render(<PlatformRoutesPageList />);

    expect(await screen.findByText('config-file-routes:1:/platform-routes')).toBeTruthy();
  });
});
