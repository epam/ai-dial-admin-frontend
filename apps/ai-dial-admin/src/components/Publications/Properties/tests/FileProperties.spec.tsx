import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import { EntitiesI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import FilesProperties from '../FileProperties';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';

describe('FileProperties', () => {
  const mockFetchFiles = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();

    (useFileFolder as Mock).mockReturnValue({
      fetchFiles: mockFetchFiles,
      files: [{}],
    });
  });
  test('renders files list title and files', () => {
    const publication = {
      files: [{ file: { name: 'file1.txt' } }, { file: { name: 'file2.txt' } }],
      action: 'download',
    };

    render(<FilesProperties publication={publication} />);

    expect(screen.getByText(`${PublicationsI18nKey.FilesListTitle}: 2`)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders files list title with empty files', () => {
    const publication = {
      files: [],
      action: 'none',
    };

    render(<FilesProperties publication={publication} />);
    expect(screen.getByText(`${PublicationsI18nKey.FilesListTitle}: 0`)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoFiles)).toBeInTheDocument();
  });
});
