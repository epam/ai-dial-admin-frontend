import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { DialFile } from '@/src/models/dial/file';
import { render } from '@testing-library/react';
import { Dispatch, SetStateAction } from 'react';
import { describe, expect, test } from 'vitest';
import FolderList from './FolderList';

const fakeContext = () => ({
  files: [],
  expandedFolders: new Set<string>(),
  filePath: '',
  fetchedFoldersData: {},
  fetchFiles: () => [],
  toggleFolder: () => void 0,
  data: [],
  exportFoldersData: {} as Record<string, DialFile[]>,
  setExportFoldersData: (() => void 0) as Dispatch<SetStateAction<Record<string, DialFile[]>>>,
});

describe('Common components - FolderList', () => {
  test('Should render successfully', () => {
    const context = fakeContext;
    const { baseElement, getByTestId } = render(<FolderList context={context as () => FileFolderContextType} />);
    expect(baseElement).toBeTruthy();
    const list = getByTestId('folder-list');
    expect(list).toBeTruthy();
  });
});
