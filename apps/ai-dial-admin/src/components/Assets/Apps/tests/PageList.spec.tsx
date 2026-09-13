import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileApplications } from '@/src/app/[lang]/assets-applications/actions';
import AssetsApplicationsPageList from '../PageList';

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({ getConfigFileApplications: vi.fn() }));
vi.mock('@/src/components/Applications/List/List', () => ({
  default: ({
    data,
    runners,
    isConfigFileSource,
  }: {
    data: unknown[];
    runners: unknown[];
    isConfigFileSource?: boolean;
  }) => (
    <div>
      admin-grid-applications:{data.length}:{runners.length}:{String(isConfigFileSource)}
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

  test('renders the admin-grid list with an empty runners list when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileApplications).mockResolvedValue({
      success: true,
      data: { entities: [{ name: 'a1' } as any], failures: [] },
    });

    render(<AssetsApplicationsPageList runners={[{ $id: 'r1' } as any]} />);

    expect(await screen.findByText('admin-grid-applications:1:0:true')).toBeTruthy();
  });
});
