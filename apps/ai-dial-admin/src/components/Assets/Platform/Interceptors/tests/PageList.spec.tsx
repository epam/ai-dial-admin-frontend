import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileInterceptors } from '@/src/app/[lang]/platform-interceptors/actions';
import PlatformInterceptorsPageList from '../PageList';

vi.mock('@/src/app/[lang]/platform-interceptors/actions', () => ({ getConfigFileInterceptors: vi.fn() }));
vi.mock('@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList', () => ({
  default: ({ names, route }: { names: string[]; route: string }) => (
    <div>
      config-file-interceptors:{names.length}:{route}
    </div>
  ),
}));
vi.mock('../List', () => ({ default: () => <div>asset-interceptors-list</div> }));

const mockContext = { showConfigFiles: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ showConfigFiles: mockContext.showConfigFiles }),
}));

describe('PlatformInterceptorsPageList', () => {
  test('renders the asset list and issues no config-file fetch by default', () => {
    mockContext.showConfigFiles = false;

    render(<PlatformInterceptorsPageList />);

    expect(screen.getByText('asset-interceptors-list')).toBeTruthy();
    expect(getConfigFileInterceptors).not.toHaveBeenCalled();
  });

  test('renders the shared config-file list, for the Interceptors route, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileInterceptors).mockResolvedValue({
      success: true,
      data: ['i1'],
    });

    render(<PlatformInterceptorsPageList />);

    expect(await screen.findByText('config-file-interceptors:1:/platform-interceptors')).toBeTruthy();
  });
});
