import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileModels } from '@/src/app/[lang]/platform-models/actions';
import PlatformModelsPageList from '../PageList';

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({ getConfigFileModels: vi.fn() }));
vi.mock('@/src/components/Common/ConfigFileEntityList/ConfigFileEntityList', () => ({
  default: ({ names, route }: { names: string[]; route: string }) => (
    <div>
      config-file-models:{names.length}:{route}
    </div>
  ),
}));
vi.mock('../List', () => ({ default: () => <div>asset-models-list</div> }));

const mockContext = { showConfigFiles: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ showConfigFiles: mockContext.showConfigFiles }),
}));

describe('PlatformModelsPageList', () => {
  test('renders the asset list and issues no config-file fetch by default', () => {
    mockContext.showConfigFiles = false;

    render(<PlatformModelsPageList />);

    expect(screen.getByText('asset-models-list')).toBeTruthy();
    expect(getConfigFileModels).not.toHaveBeenCalled();
  });

  test('renders the shared config-file list, for the Models route, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileModels).mockResolvedValue({
      success: true,
      data: ['m1'],
    });

    render(<PlatformModelsPageList />);

    expect(await screen.findByText('config-file-models:1:/platform-models')).toBeTruthy();
  });
});
