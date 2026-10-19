import { createToolset, createPlatformToolset } from '@/src/app/[lang]/assets-toolsets/actions';
import { createApp, createPlatformApplication } from '@/src/app/[lang]/assets-applications/actions';
import { DEFAULT_NEW_ENTITY_VERSION } from '@/src/constants/dial-base-entity';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
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
  hideVersionField?: boolean;
  names?: string[];
}

const assetPropertiesCalls: CapturedAssetPropertiesProps[] = [];
vi.mock('@/src/components/EntityMainProperties/Properties/AssetProperties', () => ({
  default: (props: CapturedAssetPropertiesProps) => {
    assetPropertiesCalls.push(props);
    return <div>AssetPropertiesStub</div>;
  },
}));

const folderListCalls: { rootPaths?: string[] }[] = [];
vi.mock('@/src/components/Common/FolderList/FolderList', () => ({
  default: (props: { rootPaths?: string[] }) => {
    folderListCalls.push(props);
    return <div>FolderListStub</div>;
  },
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
    folderListCalls.length = 0;
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

  test('requests file, platform, and public roots for the folder sidebar on a multi-root view', () => {
    renderCreateAsset(makeContext().ctx);

    expect(folderListCalls.at(-1)?.rootPaths).toEqual(['file/', 'platform/', 'public/']);
  });

  test('hides the version field and marks the missing version valid on the platform root', async () => {
    const { ctx, setFilePath } = makeContext();
    setFilePath('platform/');
    renderCreateAsset(ctx);

    await vi.waitFor(() => expect(lastAssetProperties().entity.version).toBeUndefined());
    expect(lastAssetProperties().hideVersionField).toBe(true);

    // The hidden field must be removed from validation, not marked invalid — an invalid entry would
    // disable submit under the real SaveValidationContext.
    const { dispatch } = useSaveValidationContext();
    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.RemoveField,
      field: 'version',
    });
    expect(dispatch).not.toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'version',
      isValid: false,
    });
    expect(screen.getByRole('button', { name: 'Buttons.Create' })).toBeEnabled();
  });

  test('restores the default version when the destination switches back to a public folder', async () => {
    const { ctx, setFilePath } = makeContext();
    setFilePath('platform/');
    const view = renderCreateAsset(ctx, { name: 'app' });

    await vi.waitFor(() => expect(lastAssetProperties().entity.version).toBeUndefined());

    setFilePath('public/');
    view.rerender(
      <CreateAsset
        view={ApplicationRoute.AssetsApplications}
        isModalOpen={true}
        context={() => ctx}
        initialValues={{ name: 'app' }}
        onClose={vi.fn()}
      />,
    );

    await vi.waitFor(() => expect(lastAssetProperties().entity.version).toBe(DEFAULT_NEW_ENTITY_VERSION));
    expect(lastAssetProperties().hideVersionField).toBe(false);

    const { dispatch } = useSaveValidationContext();
    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'version',
      isValid: true,
    });
  });

  test('creates through the platform action and redirects to the flat platform path', async () => {
    const push = vi.fn();
    (useRouter as Mock).mockReturnValue({ push, refresh: vi.fn() });
    vi.mocked(createPlatformApplication).mockResolvedValue({
      success: true,
      response: { name: 'app', path: 'platform/app', folderId: 'platform/' },
    } as never);

    const { ctx, setFilePath } = makeContext();
    setFilePath('platform/');
    renderCreateAsset(ctx, { name: 'app' });

    const user = userEvent.setup();
    await vi.waitFor(() => expect(lastAssetProperties().entity.version).toBeUndefined());
    await user.click(screen.getByRole('button', { name: 'Buttons.Create' }));

    await vi.waitFor(() => expect(createPlatformApplication).toHaveBeenCalledOnce());
    expect(createApp).not.toHaveBeenCalled();
    expect(createPlatformApplication).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'app', folderId: 'platform/' }),
    );

    await vi.waitFor(() => expect(push).toHaveBeenCalledOnce());
    expect(push).toHaveBeenCalledWith('/assets-applications/app');
  });

  test('creates a colon-named platform application and redirects through the encoded flat route', async () => {
    const push = vi.fn();
    (useRouter as Mock).mockReturnValue({ push, refresh: vi.fn() });
    vi.mocked(createPlatformApplication).mockResolvedValue({
      success: true,
      response: { name: 'app:platform', path: 'platform/app:platform', folderId: 'platform/' },
    } as never);

    const { ctx, setFilePath } = makeContext();
    setFilePath('platform/');
    renderCreateAsset(ctx, { name: 'app:platform' });

    const user = userEvent.setup();
    await vi.waitFor(() => expect(lastAssetProperties().entity.version).toBeUndefined());
    await user.click(screen.getByRole('button', { name: 'Buttons.Create' }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/assets-applications/app%3Aplatform'));
  });

  test('creates a colon-named platform toolset and redirects through the encoded flat route', async () => {
    const push = vi.fn();
    (useRouter as Mock).mockReturnValue({ push, refresh: vi.fn() });
    vi.mocked(createPlatformToolset).mockResolvedValue({
      success: true,
      response: { name: 'toolset:platform', path: 'platform/toolset:platform', folderId: 'platform/' },
    } as never);

    const { ctx, setFilePath } = makeContext();
    setFilePath('platform/');
    renderCreateAsset(ctx, { name: 'toolset:platform' }, ApplicationRoute.AssetsToolsets);

    const user = userEvent.setup();
    await vi.waitFor(() => expect(lastAssetProperties().entity.version).toBeUndefined());
    await user.click(screen.getByRole('button', { name: 'Buttons.Create' }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/assets-toolsets/toolset%3Aplatform'));
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
    await vi.waitFor(() => expect(lastAssetProperties().hideVersionField).toBe(false));
    await user.click(screen.getByRole('button', { name: 'Buttons.Create' }));

    await vi.waitFor(() => expect(createApp).toHaveBeenCalledOnce());
    expect(createPlatformApplication).not.toHaveBeenCalled();
    expect(createApp).toHaveBeenCalledWith(expect.objectContaining({ name: 't', folderId: 'public/' }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledOnce());
    expect(push).toHaveBeenCalledWith('/assets-applications/t?path=public%2Ft__1.0.0');
  });
});
