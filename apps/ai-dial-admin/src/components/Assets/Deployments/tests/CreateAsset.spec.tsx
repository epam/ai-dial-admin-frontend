import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
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
});
