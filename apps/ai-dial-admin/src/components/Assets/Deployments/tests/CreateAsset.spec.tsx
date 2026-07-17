import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { Mock, describe, expect, test, vi } from 'vitest';
import CreateAsset from '../CreateAsset';

vi.mock('@/src/components/EntityMainProperties/Properties/AssetProperties', () => ({
  default: () => <div data-testprop="asset-properties-stub">AssetPropertiesStub</div>,
}));

vi.mock('@/src/components/Common/FolderList/FolderList', () => ({
  default: () => <div>FolderListStub</div>,
}));

const baseContext: Partial<AssetsFolderContext> = {
  files: [],
  expandedFolders: new Set<string>(),
  filePath: '',
  fetchedFoldersData: {},
  fetchFiles: vi.fn(),
  toggleFolder: vi.fn(),
  bulkSelectedData: {},
  setBulkSelectedData: vi.fn(),
  isFetchingFiles: false,
};

const renderWithData = (data: AssetsFolderContext['data']) => {
  const ctx = { ...baseContext, data } as AssetsFolderContext;
  return render(
    <CreateAsset
      view={ApplicationRoute.AssetsToolsets}
      isModalOpen={true}
      context={() => ctx}
      onCreate={vi.fn()}
      onClose={vi.fn()}
    />,
  );
};

describe('CreateAsset', () => {
  test('renders loader and hides AssetProperties while folder data is null', () => {
    renderWithData(null);

    expect(screen.queryByText('AssetPropertiesStub')).not.toBeInTheDocument();
  });

  test('renders AssetProperties once folder data has loaded (empty folder)', () => {
    renderWithData([]);

    expect(screen.getByText('AssetPropertiesStub')).toBeInTheDocument();
  });

  test('renders AssetProperties once folder data has loaded (populated folder)', () => {
    renderWithData([{ name: 'existing', version: '1.0.0' }] as AssetsFolderContext['data']);

    expect(screen.getByText('AssetPropertiesStub')).toBeInTheDocument();
  });

  test('redirects to the created resource using admin-format path fields from the write response', async () => {
    // Mirrors the MCP-container "Create Asset Toolset" flow: initialValues present (leading slash),
    // and onCreate resolves the way the fixed AssetApi.put does — response carrying path/folderId/name/version.
    const push = vi.fn();
    (useRouter as Mock).mockReturnValue({ push, refresh: vi.fn() });

    const onCreate = vi.fn(
      (): Promise<ServerActionResponse> =>
        Promise.resolve({
          success: true,
          response: {
            name: 't',
            path: 'public/t__1.0',
            folderId: 'public/',
            version: '1.0',
            url: 'toolsets/public/t__1.0',
          },
        }),
    );

    const ctx = { ...baseContext, data: [] } as AssetsFolderContext;
    render(
      <CreateAsset
        view={ApplicationRoute.AssetsToolsets}
        isModalOpen={true}
        initialValues={{ name: 't' }}
        context={() => ctx}
        onCreate={onCreate}
        onClose={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Buttons.Create' }));

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith('/assets-toolsets/t?path=public%2Ft__1.0');
  });
});
