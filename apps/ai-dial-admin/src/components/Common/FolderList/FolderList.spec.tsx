import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FolderList from './FolderList';
import { EntitiesI18nKey } from '@/src/constants/i18n';

const fakeContext = () => ({
  files: [],
  expandedFolders: new Set<string>(),
  filePath: '',
  fetchedFoldersData: {},
  fetchFiles: () => [],
  toggleFolder: () => void 0,
  data: [],
  exportFoldersData: {},
  setExportFoldersData: () => {},
});

describe('FolderList', () => {
  it('renders no data message when files are empty', () => {
    render(<FolderList context={fakeContext} />);
    expect(screen.getByText(EntitiesI18nKey.NoFolders)).toBeInTheDocument();
  });
});
