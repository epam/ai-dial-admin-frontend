import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileModels } from '@/src/app/[lang]/platform-models/actions';
import PlatformModelsPageList from '../PageList';

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({ getConfigFileModels: vi.fn() }));
vi.mock('@/src/components/Models/List/List', () => ({
  default: ({ data, isConfigFileSource }: { data: unknown[]; isConfigFileSource?: boolean }) => (
    <div>
      admin-grid-models:{data.length}:{String(isConfigFileSource)}
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

  test('renders the admin-grid list, marked as config-file-sourced, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileModels).mockResolvedValue({
      success: true,
      data: { entities: [{ name: 'm1' } as any], failures: [] },
    });

    render(<PlatformModelsPageList />);

    expect(await screen.findByText('admin-grid-models:1:true')).toBeTruthy();
  });
});
