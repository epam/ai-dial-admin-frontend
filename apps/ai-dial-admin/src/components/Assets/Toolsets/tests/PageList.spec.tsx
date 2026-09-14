import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import AssetsToolsetsPageList from '../PageList';

vi.mock('@/src/app/[lang]/assets-toolsets/actions', () => ({ getConfigFileToolsets: vi.fn() }));
vi.mock('@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList', () => ({
  default: ({ names, route }: { names: string[]; route: string }) => (
    <div>
      config-file-toolsets:{names.length}:{route}
    </div>
  ),
}));
vi.mock('../List', () => ({ default: () => <div>asset-toolsets-list</div> }));

const mockContext = { showConfigFiles: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ showConfigFiles: mockContext.showConfigFiles }),
}));

describe('AssetsToolsetsPageList', () => {
  test('renders the asset list and issues no config-file fetch by default', () => {
    mockContext.showConfigFiles = false;

    render(<AssetsToolsetsPageList />);

    expect(screen.getByText('asset-toolsets-list')).toBeTruthy();
    expect(getConfigFileToolsets).not.toHaveBeenCalled();
  });

  test('renders the shared config-file list, for the Toolsets route, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileToolsets).mockResolvedValue({
      success: true,
      data: ['t1'],
    });

    render(<AssetsToolsetsPageList />);

    expect(await screen.findByText('config-file-toolsets:1:/assets-toolsets')).toBeTruthy();
  });
});
