import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileInterceptors } from '@/src/app/[lang]/platform-interceptors/actions';
import PlatformInterceptorsPageList from '../PageList';

vi.mock('@/src/app/[lang]/platform-interceptors/actions', () => ({ getConfigFileInterceptors: vi.fn() }));
vi.mock('@/src/components/Interceptors/List/List', () => ({
  default: ({ data, isConfigFileSource }: { data: unknown[]; isConfigFileSource?: boolean }) => (
    <div>
      admin-grid-interceptors:{data.length}:{String(isConfigFileSource)}
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

  test('renders the admin-grid list, marked as config-file-sourced, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileInterceptors).mockResolvedValue({
      success: true,
      data: { entities: [{ name: 'i1' } as any], failures: [] },
    });

    render(<PlatformInterceptorsPageList />);

    expect(await screen.findByText('admin-grid-interceptors:1:true')).toBeTruthy();
  });
});
