import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import { EntitiesI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { ActionType, FilePublication, PublicationFile, PublicationStatus } from '@/src/models/dial/publications';
import FilesProperties from '../FileProperties';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';

vi.mock('@/src/context/assets/FileFolderContext', () => ({
  useFileFolder: vi.fn(),
  FileFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

// The component reads the files only; the factory carries the rest of a publication's required members.
const publicationFile = (name: string): PublicationFile => ({
  file: { name },
  sourceUrl: `files/my-bucket/${name}`,
  targetUrl: `files/public/${name}`,
  reviewUrl: `files/review/${name}`,
  action: ActionType.ADD,
});

const filePublication = (files: PublicationFile[]): FilePublication => ({
  path: 'public/folder',
  requestName: 'request',
  author: 'author',
  createdAt: '0',
  status: PublicationStatus.PENDING,
  action: ActionType.ADD,
  folderId: 'public',
  files,
});

describe('FileProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useFileFolder as Mock).mockReturnValue({
      files: [{}],
    });
  });
  test('renders files list title and files', () => {
    const publication = filePublication([publicationFile('file1.txt'), publicationFile('file2.txt')]);

    render(<FilesProperties publication={publication} setAddedFiles={vi.fn()} />);

    expect(screen.getByText(`${PublicationsI18nKey.FilesListTitle}: 2`)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders files list title with empty files', () => {
    const publication = filePublication([]);

    render(<FilesProperties publication={publication} setAddedFiles={vi.fn()} />);
    expect(screen.getByText(`${PublicationsI18nKey.FilesListTitle}: 0`)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoFiles)).toBeInTheDocument();
  });
});
