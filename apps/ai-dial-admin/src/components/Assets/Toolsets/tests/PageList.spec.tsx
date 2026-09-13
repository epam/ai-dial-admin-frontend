import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getConfigFileToolsets } from '@/src/app/[lang]/assets-toolsets/actions';
import AssetsToolsetsPageList from '../PageList';

vi.mock('@/src/app/[lang]/assets-toolsets/actions', () => ({ getConfigFileToolsets: vi.fn() }));
vi.mock('@/src/components/Toolsets/List', () => ({
  default: ({ data, isConfigFileSource }: { data: unknown[]; isConfigFileSource?: boolean }) => (
    <div>
      admin-grid-toolsets:{data.length}:{String(isConfigFileSource)}
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

  test('renders the admin-grid list, marked as config-file-sourced, when the toggle is on', async () => {
    mockContext.showConfigFiles = true;
    vi.mocked(getConfigFileToolsets).mockResolvedValue({
      success: true,
      data: { entities: [{ name: 't1' } as any], failures: [] },
    });

    render(<AssetsToolsetsPageList />);

    expect(await screen.findByText('admin-grid-toolsets:1:true')).toBeTruthy();
  });
});
