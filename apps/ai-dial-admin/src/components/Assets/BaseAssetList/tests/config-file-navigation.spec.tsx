import { DialFileNodeType } from '@epam/ai-dial-ui-kit';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import BaseAssetList from '../BaseAssetList';

const { push, windowOpen, data, fetchedFoldersData } = vi.hoisted(() => ({
  push: vi.fn(),
  windowOpen: vi.fn(),
  data: [] as unknown[],
  fetchedFoldersData: {} as Record<string, unknown[]>,
}));

const item = {
  name: 'MyApp',
  path: 'public/folder/MyApp__1.0',
  folderId: 'public/folder/',
  version: '1.0',
  nodeType: DialFileNodeType.ITEM,
};

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: () => ({
    fetchFiles: vi.fn(),
    filePath: 'file/',
    data,
    fetchedFoldersData,
    setFilePath: vi.fn(),
  }),
}));

vi.mock('@/src/components/Common/FileManager/FileManager', () => ({
  __esModule: true,
  default: (props: any) => (
    <>
      <button onClick={() => props.onTableFileClick(item)}>open-details</button>
      <button onClick={() => props.onOpenInNewTab(item)}>open-in-new-tab</button>
    </>
  ),
}));

vi.mock('../Modals', () => ({ __esModule: true, default: () => null }));

describe('BaseAssetList config-file navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    vi.stubGlobal('open', windowOpen);
  });

  test('preserves the path query when opening config-file asset details', async () => {
    const user = userEvent.setup();
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    await user.click(screen.getByRole('button', { name: 'open-details' }));

    expect(push).toHaveBeenCalledWith('/assets-applications/MyApp?path=public%2Ffolder%2FMyApp__1.0&configFile=true');
  });

  test('opens the corrected URL in a new tab for modifier-click navigation', async () => {
    const user = userEvent.setup();
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    await user.keyboard('[ControlLeft>]');
    await user.click(screen.getByRole('button', { name: 'open-details' }));
    await user.keyboard('[/ControlLeft]');

    expect(windowOpen).toHaveBeenCalledWith(
      '/assets-applications/MyApp?path=public%2Ffolder%2FMyApp__1.0&configFile=true',
      '_blank',
    );
    expect(push).not.toHaveBeenCalled();
  });

  test('opens the corrected URL through the action-menu new-tab callback', async () => {
    const user = userEvent.setup();
    render(<BaseAssetList view={ApplicationRoute.AssetsApplications} />);

    await user.click(screen.getByRole('button', { name: 'open-in-new-tab' }));

    expect(windowOpen).toHaveBeenCalledWith(
      '/assets-applications/MyApp?path=public%2Ffolder%2FMyApp__1.0&configFile=true',
      '_blank',
    );
  });
});
