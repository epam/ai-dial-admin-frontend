import { ROOT_FOLDER } from '@/src/constants/file';
import { EntitiesI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { Asset } from '@/src/models/dial/deployment-asset';
import { FILE_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import FolderList from './FolderList';

// `Asset` (the shape every real caller's context actually holds) doesn't structurally satisfy
// `AssetListItem` — its inherited `DialFile.name` is optional, `AssetListItem.name` is required — so
// the fixture is cast the same way `FolderList` itself treats a concrete per-entity context.
const fakeContext = (files: Asset[] = []) =>
  ({
    isFetchingFiles: false,
    files,
    expandedFolders: new Set<string>(),
    setExpandedFolders: vi.fn(),
    filePath: '',
    setFilePath: vi.fn(),
    fetchedFoldersData: {},
    fetchFiles: vi.fn(),
    toggleFolder: () => void 0,
    data: [],
  }) as unknown as AssetsFolderContextReader<AssetListItem>;

describe('FolderList', () => {
  test('renders no data message when files are empty', () => {
    render(<FolderList context={fakeContext} />);
    expect(screen.getByText(EntitiesI18nKey.NoFolders)).toBeInTheDocument();
  });

  test('auto-fetches the default public root when files are empty', async () => {
    const context = fakeContext();
    render(<FolderList context={() => context} />);

    await waitFor(() => expect(context.fetchFiles).toHaveBeenCalledWith(`${ROOT_FOLDER}/`));
  });

  test('auto-fetches both roots as an array when rootPaths has more than one entry', async () => {
    const context = fakeContext();
    render(<FolderList context={() => context} rootPaths={['platform/', 'public/']} />);

    await waitFor(() => expect(context.fetchFiles).toHaveBeenCalledWith(['platform/', 'public/']));
  });

  test('auto-fetches the single rootPaths entry unwrapped when it is the only one', async () => {
    const context = fakeContext();
    render(<FolderList context={() => context} rootPaths={['platform/']} />);

    await waitFor(() => expect(context.fetchFiles).toHaveBeenCalledWith('platform/'));
  });

  test('does not auto-fetch when files are already loaded', () => {
    const context = fakeContext([{ name: 'folder', path: 'public/', folderId: 'public/' }]);
    render(<FolderList context={() => context} rootPaths={['platform/', 'public/']} />);

    expect(context.fetchFiles).not.toHaveBeenCalled();
  });
});

describe('FolderList tree', () => {
  const folder = (name: string, path: string, items: Asset[] = []) =>
    ({ name, path, nodeType: 'folder', folderId: 'public/', items }) as unknown as Asset;

  const treeContext = (overrides: Record<string, unknown> = {}) => {
    const toggleFolder = vi.fn();
    const context = {
      ...(fakeContext([
        folder('file', `${FILE_ROOT_FOLDER}/`),
        folder('apps', 'public/apps/', [folder('child', 'public/apps/child/')]),
        folder('.hidden', 'public/.hidden/'),
      ]) as object),
      toggleFolder,
      ...overrides,
    } as unknown as AssetsFolderContextReader<AssetListItem>;
    return { context, toggleFolder };
  };

  test('exposes a localized tree and lists folders, dot-folders included, without the root', () => {
    const { context } = treeContext();
    render(<FolderList context={() => context} />);

    expect(screen.getByRole('tree', { name: FoldersI18nKey.Folders })).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: 'apps' })).toBeInTheDocument();
    expect(screen.getByRole('treeitem', { name: '.hidden' })).toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: 'file' })).not.toBeInTheDocument();
  });

  test('calls toggleFolder once per click with the context node and never steals focus', async () => {
    const { context, toggleFolder } = treeContext();
    render(<FolderList context={() => context} />);

    expect(document.body).toHaveFocus();
    await userEvent.click(screen.getByText('apps'));

    expect(toggleFolder).toHaveBeenCalledTimes(1);
    expect(toggleFolder.mock.calls[0][0]).toMatchObject({ path: 'public/apps/' });
  });

  test('calls toggleFolder once on Enter', async () => {
    const { context, toggleFolder } = treeContext();
    render(<FolderList context={() => context} />);

    screen.getByRole('treeitem', { name: 'apps' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(toggleFolder).toHaveBeenCalledTimes(1);
  });

  test('expansion and selection follow the context', () => {
    const { context } = treeContext({ expandedFolders: new Set(['public/apps/']), filePath: 'public/apps/child/' });
    render(<FolderList context={() => context} />);

    expect(screen.getByRole('treeitem', { name: 'apps' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('treeitem', { name: 'child' })).toHaveAttribute('aria-selected', 'true');
  });

  test('keeps a collapsed folder collapsed when the context does not expand it', async () => {
    const { context } = treeContext();
    render(<FolderList context={() => context} />);

    await userEvent.click(screen.getByText('apps'));

    expect(screen.getByRole('treeitem', { name: 'apps' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('treeitem', { name: 'child' })).not.toBeInTheDocument();
  });

  test('hides the caret of a fetched folder that has no subfolders', () => {
    const { context } = treeContext({ fetchedFoldersData: { 'public/.hidden/': [] } });
    render(<FolderList context={() => context} />);

    expect(screen.getByRole('treeitem', { name: 'apps' }).querySelector('svg')).not.toHaveClass('text-transparent');
    expect(screen.getByRole('treeitem', { name: '.hidden' }).querySelector('svg')).toHaveClass('text-transparent');
  });
});
