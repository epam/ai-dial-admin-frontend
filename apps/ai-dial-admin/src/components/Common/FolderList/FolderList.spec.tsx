import { ROOT_FOLDER } from '@/src/constants/file';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { Asset } from '@/src/models/dial/deployment-asset';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import FolderList from './FolderList';

const fakeContext = (files: Asset[] = []) => ({
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
});

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
