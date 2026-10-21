import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import { EntityFieldsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { ActionType, PublicationStatus } from '@/src/models/dial/publications';
import BaseProperties from '../BaseProperties';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { ROOT_FOLDER } from '@/src/constants/file';

vi.mock('@/src/context/assets/FileFolderContext', () => ({
  useFileFolder: vi.fn(),
  FileFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/components/Common/FilePath/FilePath', () => ({
  default: ({ label, value }: { label: string; value: string }) => (
    <div>
      <label>{label}</label>
      <span>{value}</span>
    </div>
  ),
}));

describe('BaseProperties', () => {
  const mockFetchFiles = vi.fn();
  const mockOnChange = vi.fn();
  const mockGetContext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useFileFolder as Mock).mockReturnValue({
      fetchFiles: mockFetchFiles,
      files: [{}],
    });

    mockGetContext.mockReturnValue({
      fetchFiles: mockFetchFiles,
      files: [{}],
    });
  });

  test('renders display author field and folder path', () => {
    const publication = {
      displayAuthor: 'John Doe',
      folderId: '/test/folder',
      files: [],
      action: ActionType.DELETE,
      path: 'publications/public/request',
      requestName: 'request',
      author: 'John Doe',
      createdAt: '2026-08-21T09:37:29Z',
      status: PublicationStatus.PENDING,
    };

    render(<BaseProperties publication={publication} onChange={mockOnChange} getContext={mockGetContext} />);

    expect(screen.getByText(EntityFieldsI18nKey.displayAuthor)).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.FolderStorage)).toBeInTheDocument();
    expect(screen.getByText('/test/folder')).toBeInTheDocument();
  });

  test('renders with empty display author', () => {
    const publication = {
      displayAuthor: '',
      folderId: '/test/folder',
      files: [],
      action: ActionType.ADD,
      path: 'publications/public/request',
      requestName: 'request',
      author: '',
      createdAt: '2026-08-21T09:37:29Z',
      status: PublicationStatus.PENDING,
    };

    render(<BaseProperties publication={publication} onChange={mockOnChange} getContext={mockGetContext} />);

    expect(screen.getByText(EntityFieldsI18nKey.displayAuthor)).toBeInTheDocument();
    const input = screen.getByPlaceholderText('EntityPlaceholders.DisplayAuthor');
    expect(input).toHaveValue('');
  });

  test('calls fetchFiles on mount when files array is empty', () => {
    mockGetContext.mockReturnValue({
      fetchFiles: mockFetchFiles,
      files: [],
    });

    const publication = {
      displayAuthor: 'John Doe',
      folderId: '/test/folder',
      files: [],
      action: ActionType.DELETE,
      path: 'publications/public/request',
      requestName: 'request',
      author: 'John Doe',
      createdAt: '2026-08-21T09:37:29Z',
      status: PublicationStatus.PENDING,
    };

    render(<BaseProperties publication={publication} onChange={mockOnChange} getContext={mockGetContext} />);

    expect(mockFetchFiles).toHaveBeenCalledWith(`${ROOT_FOLDER}/`);
  });

  test('does not call fetchFiles on mount when files array is not empty', () => {
    const publication = {
      displayAuthor: 'John Doe',
      folderId: '/test/folder',
      files: [],
      action: ActionType.DELETE,
      path: 'publications/public/request',
      requestName: 'request',
      author: 'John Doe',
      createdAt: '2026-08-21T09:37:29Z',
      status: PublicationStatus.PENDING,
    };

    render(<BaseProperties publication={publication} onChange={mockOnChange} getContext={mockGetContext} />);

    expect(mockFetchFiles).not.toHaveBeenCalled();
  });
});
