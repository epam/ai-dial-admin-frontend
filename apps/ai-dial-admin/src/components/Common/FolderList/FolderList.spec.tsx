import { EntitiesI18nKey } from '@/src/constants/i18n';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import FolderList from './FolderList';

const fakeContext = () => ({
  isFetchingFiles: false,
  files: [],
  expandedFolders: new Set<string>(),
  setExpandedFolders: vi.fn(),
  filePath: '',
  setFilePath: vi.fn(),
  fetchedFoldersData: {},
  fetchFiles: () => [],
  toggleFolder: () => void 0,
  data: [],
});

describe('FolderList', () => {
  test('renders no data message when files are empty', () => {
    render(<FolderList context={fakeContext} />);
    expect(screen.getByText(EntitiesI18nKey.NoFolders)).toBeInTheDocument();
  });
});
