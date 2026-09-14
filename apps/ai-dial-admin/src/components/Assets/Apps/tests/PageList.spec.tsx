import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileApplications } from '@/src/app/[lang]/assets-applications/actions';
import AssetsApplicationsPageList from '../PageList';

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({ getConfigFileApplications: vi.fn() }));
vi.mock('@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList', () => ({
  default: ({ names, route }: { names: string[]; route: string }) => (
    <div>
      config-file-applications:{names.length}:{route}
    </div>
  ),
}));
vi.mock('../List', () => ({
  default: ({ runners }: { runners: unknown[] }) => <div>asset-apps-list:{runners.length}</div>,
}));

const mockContext = { showConfigFiles: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ showConfigFiles: mockContext.showConfigFiles }),
}));

describe('AssetsApplicationsPageList', () => {
  test('renders the asset list, passing runners through, and issues no config-file fetch by default', () => {
    mockContext.showConfigFiles = false;

    render(<AssetsApplicationsPageList runners={[{ $id: 'r1' } as any]} />);

    expect(screen.getByText('asset-apps-list:1')).toBeTruthy();
    expect(getConfigFileApplications).not.toHaveBeenCalled();
  });

  test('renders the shared config-file list, for the Applications route, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileApplications).mockResolvedValue({
      success: true,
      data: ['a1'],
    });

    render(<AssetsApplicationsPageList runners={[{ $id: 'r1' } as any]} />);

    expect(await screen.findByText('config-file-applications:1:/assets-applications')).toBeTruthy();
  });
});
