import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import ConfigFileListSwap from '../ConfigFileListSwap';

const mockContext = { showConfigFiles: false };

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ showConfigFiles: mockContext.showConfigFiles }),
}));

describe('ConfigFileListSwap', () => {
  test('renders the asset list and issues no fetch when showConfigFiles is off', () => {
    mockContext.showConfigFiles = false;
    const fetchConfigFileList = vi.fn();

    render(
      <ConfigFileListSwap
        assetList={<div>asset-list</div>}
        fetchConfigFileList={fetchConfigFileList}
        renderConfigFileList={(data) => <div>config-file-list:{data.length}</div>}
      />,
    );

    expect(screen.getByText('asset-list')).toBeTruthy();
    expect(fetchConfigFileList).not.toHaveBeenCalled();
  });

  test('fetches and renders the config-file list when showConfigFiles is on', async () => {
    mockContext.showConfigFiles = true;
    const fetchConfigFileList = vi.fn().mockResolvedValue({
      success: true,
      data: { entities: [{ name: 'a' }, { name: 'b' }], failures: [] },
    });

    render(
      <ConfigFileListSwap
        assetList={<div>asset-list</div>}
        fetchConfigFileList={fetchConfigFileList}
        renderConfigFileList={(data) => <div>config-file-list:{data.length}</div>}
      />,
    );

    expect(await screen.findByText('config-file-list:2')).toBeTruthy();
    expect(fetchConfigFileList).toHaveBeenCalledOnce();
  });
});
