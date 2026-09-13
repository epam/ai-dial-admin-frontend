import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileRoutes } from '@/src/app/[lang]/platform-routes/actions';
import PlatformRoutesPageList from '../PageList';

vi.mock('@/src/app/[lang]/platform-routes/actions', () => ({ getConfigFileRoutes: vi.fn() }));
vi.mock('@/src/components/Routes/List/RoutesList', () => ({
  default: ({ data, isConfigFileSource }: { data: unknown[]; isConfigFileSource?: boolean }) => (
    <div>
      admin-grid-routes:{data.length}:{String(isConfigFileSource)}
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

  test('renders the admin-grid list, marked as config-file-sourced, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileRoutes).mockResolvedValue({
      success: true,
      data: { entities: [{ name: 'r1' } as any], failures: [] },
    });

    render(<PlatformRoutesPageList />);

    expect(await screen.findByText('admin-grid-routes:1:true')).toBeTruthy();
  });
});
