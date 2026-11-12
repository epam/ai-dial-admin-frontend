import { createApp } from '@/src/app/[lang]/assets-applications/actions';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, Mock, describe, expect, test, vi } from 'vitest';
import CreateAsset from '../CreateAsset';

// The real map module wires these two actions for the AssetsApplications view; mocking the actions
// module (not the map) keeps the test on the dispatch surface the component actually uses. The
// remaining exports only need to exist for `BaseAssetList/utils`'s module-scope maps.
vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  bulkDeleteApps: vi.fn(),
  bulkDeletePlatformApplications: vi.fn(),
  createApp: vi.fn().mockResolvedValue({ success: true }),
  createPlatformApplication: vi.fn().mockResolvedValue({ success: true }),
  exportApps: vi.fn(),
  getApp: vi.fn(),
  getPlatformApplication: vi.fn(),
  importApps: vi.fn(),
  moveApps: vi.fn(),
}));

vi.mock('@/src/app/[lang]/assets-toolsets/actions', () => ({
  bulkDeletePlatformToolsets: vi.fn(),
  bulkDeleteToolsets: vi.fn(),
  createPlatformToolset: vi.fn().mockResolvedValue({ success: true }),
  createToolset: vi.fn().mockResolvedValue({ success: true }),
  exportToolsets: vi.fn(),
  getPlatformToolset: vi.fn(),
  getToolset: vi.fn(),
  importToolsets: vi.fn(),
  moveToolsets: vi.fn(),
}));

interface CapturedAssetPropertiesProps {
  entity: { version?: string };
  names?: string[];
}

const assetPropertiesCalls: CapturedAssetPropertiesProps[] = [];
// Counts mounts, so a test can tell a remount (fresh ID validation) from a plain re-render.
let assetPropertiesMounts = 0;
vi.mock('@/src/components/EntityMainProperties/Properties/AssetProperties', async () => {
  const { useEffect } = await import('react');
  return {
    default: (props: CapturedAssetPropertiesProps) => {
      assetPropertiesCalls.push(props);
      useEffect(() => {
        assetPropertiesMounts += 1;
      }, []);
      return <div>AssetPropertiesStub</div>;
    },
  };
});

vi.mock('@/src/components/Common/FolderList/FolderList', () => ({
  default: () => <div>FolderListStub</div>,
}));

// A mutable `filePath` behind a getter, so a test can flip the destination bucket between renders
// exactly the way selecting another folder in the sidebar does.
// `items` are the cached listing of whichever folder is selected; `null` means that folder has not been
// fetched, and `hasFetchError` is the context's signal that the fetch failed.
const makeContext = (items: AssetListItem[] | null = [], hasFetchError = false) => {
  let currentPath = '';
  const ctx = {
    files: [],
    expandedFolders: new Set<string>(),
    setExpandedFolders: vi.fn(),
    get filePath() {
      return currentPath;
    },
    set filePath(path: string) {
      currentPath = path;
    },
    setFilePath: vi.fn(),
    get fetchedFoldersData() {
      return items == null ? {} : { [currentPath]: items };
    },
    fetchFiles: vi.fn(),
    toggleFolder: vi.fn(),
    isFetchingFiles: false,
    hasFetchError,
  } as unknown as AssetsFolderContextReader;

  return { ctx, setFilePath: (path: string) => (currentPath = path) };
};

const renderCreateAsset = (
  ctx: AssetsFolderContextReader,
  initialValues?: Partial<AssetWithVersion>,
  view = ApplicationRoute.AssetsApplications,
) =>
  render(
    <CreateAsset view={view} isModalOpen={true} context={() => ctx} initialValues={initialValues} onClose={vi.fn()} />,
  );

const lastAssetProperties = () => assetPropertiesCalls.at(-1)!;

describe('CreateAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assetPropertiesCalls.length = 0;
  });

  test('renders loader and hides AssetProperties while the selected folder has not loaded', () => {
    renderCreateAsset(makeContext(null).ctx);

    expect(screen.queryByText('AssetPropertiesStub')).not.toBeInTheDocument();
    expect(useNotification().showNotification).not.toHaveBeenCalled();
  });

  test('renders AssetProperties once the selected folder has loaded (empty folder)', () => {
    renderCreateAsset(makeContext([]).ctx);

    expect(screen.getByText('AssetPropertiesStub')).toBeInTheDocument();
  });

  test('renders AssetProperties with the names of the selected folder (populated folder)', () => {
    renderCreateAsset(makeContext([{ name: 'existing', version: '1.0.0' }] as unknown as AssetListItem[]).ctx);

    expect(screen.getByText('AssetPropertiesStub')).toBeInTheDocument();
    expect(lastAssetProperties().names).toEqual(['existing']);
  });

  test('stays usable and reports the failure when the selected folder could not be loaded', () => {
    renderCreateAsset(makeContext(null, true).ctx);

    expect(screen.getByText('AssetPropertiesStub')).toBeInTheDocument();
    expect(lastAssetProperties().names).toEqual([]);
    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: FoldersI18nKey.LoadFolderError }),
    );
  });

  test('does not report a failure for a folder that loaded', () => {
    renderCreateAsset(makeContext([]).ctx);

    expect(useNotification().showNotification).not.toHaveBeenCalled();
  });

  test('creates through the public action and redirects through the selected folder and version', async () => {
    const push = vi.fn();
    (useRouter as Mock).mockReturnValue({ push, refresh: vi.fn() });
    vi.mocked(createApp).mockResolvedValue({
      success: true,
      response: { name: 't' },
    } as never);

    const { ctx, setFilePath } = makeContext();
    setFilePath('public/');
    renderCreateAsset(ctx, { name: 't' });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Buttons.Create' }));

    await vi.waitFor(() => expect(createApp).toHaveBeenCalledOnce());
    expect(createApp).toHaveBeenCalledWith(expect.objectContaining({ name: 't', folderId: 'public/' }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledOnce());
    expect(push).toHaveBeenCalledWith('/assets-applications/t?path=public%2Ft__1.0.0');
  });
});

describe('CreateAsset — destination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assetPropertiesCalls.length = 0;
    assetPropertiesMounts = 0;
  });

  test('renders the public folder tree and never offers a platform root', () => {
    renderCreateAsset(makeContext([]).ctx);

    expect(screen.getByText('FolderListStub')).toBeInTheDocument();
  });

  test('always shows the versioned form', () => {
    renderCreateAsset(makeContext([]).ctx);

    expect(lastAssetProperties().entity.version).toBeDefined();
  });

  test('renders the top slot above the form when one is given', () => {
    render(
      <CreateAsset
        view={ApplicationRoute.AssetsApplications}
        isModalOpen
        context={() => makeContext([]).ctx}
        topSlot={<div>destination-slot</div>}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('destination-slot')).toBeInTheDocument();
  });

  test('renders no top slot by default', () => {
    renderCreateAsset(makeContext([]).ctx);

    expect(screen.queryByText('destination-slot')).not.toBeInTheDocument();
  });

  test('re-validates the ID when the destination folder changes', () => {
    const { ctx } = makeContext([{ name: 'in-a' }] as unknown as AssetListItem[]);
    ctx.filePath = 'public/a/';
    let currentCtx = ctx;
    const { rerender } = render(
      <CreateAsset view={ApplicationRoute.AssetsToolsets} isModalOpen context={() => currentCtx} onClose={vi.fn()} />,
    );
    const mountsInFirst = assetPropertiesMounts;

    currentCtx = {
      ...ctx,
      filePath: 'public/b/',
      fetchedFoldersData: { 'public/b/': [{ name: 'in-b' }] },
    } as unknown as AssetsFolderContextReader;
    rerender(
      <CreateAsset view={ApplicationRoute.AssetsToolsets} isModalOpen context={() => currentCtx} onClose={vi.fn()} />,
    );

    expect(assetPropertiesMounts).toBe(mountsInFirst + 1);
    expect(lastAssetProperties().names).toEqual(['in-b']);
  });
});
