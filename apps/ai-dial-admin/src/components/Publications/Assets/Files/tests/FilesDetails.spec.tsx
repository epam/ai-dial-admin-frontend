import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ActionType, FilePublication, PublicationFile } from '@/src/models/dial/publications';
import FilesDetails from '../FilesDetails';

let capturedFilesListProps: any = {};

vi.mock('../FilesList', () => ({
  default: (props: any) => {
    capturedFilesListProps = props;
    return <section aria-label="files-list" />;
  },
}));

const mockFiles: PublicationFile[] = [
  {
    sourceUrl: 'source/file1.txt',
    targetUrl: 'target/file1.txt',
    reviewUrl: 'review/file1.txt',
    action: ActionType.ADD,
    file: { name: 'file1.txt', path: '/path/file1.txt' },
  },
  {
    sourceUrl: 'source/file2.pdf',
    targetUrl: 'target/file2.pdf',
    reviewUrl: 'review/file2.pdf',
    action: ActionType.ADD,
    file: { name: 'file2.pdf', path: '/path/file2.pdf' },
  },
];

const createMockPublication = (files?: PublicationFile[]): FilePublication => ({
  path: 'publications/test-publication',
  requestName: 'test-request',
  author: 'test@example.com',
  displayAuthor: 'Test Author',
  createdAt: '2024-01-01',
  status: 'pending',
  action: ActionType.ADD,
  folderId: 'folder1',
  files: files ?? mockFiles,
});

const setup = (
  props: Partial<{
    publication: FilePublication;
    onChange: any;
    addedFiles: File[];
    setAddedFiles: any;
  }> = {},
) => {
  const onChange = props.onChange ?? vi.fn();
  const setAddedFiles = props.setAddedFiles ?? vi.fn();
  const publication = props.publication ?? createMockPublication();
  const addedFiles = props.addedFiles;

  const utils = render(
    <FilesDetails
      publication={publication}
      onChange={onChange}
      addedFiles={addedFiles}
      setAddedFiles={setAddedFiles}
    />,
  );

  return { onChange, setAddedFiles, publication, ...utils };
};

describe('Publications :: FilesDetails', () => {
  test('renders title with file count', () => {
    setup();

    expect(screen.getByText(/Publications.File.FilesListTitle/)).toBeInTheDocument();
    expect(screen.getByText(/: 2$/)).toBeInTheDocument();
  });

  test('renders title with combined count of publication files and added files', () => {
    const addedFile = new File(['content'], 'added-file.txt', { type: 'text/plain' });
    setup({ addedFiles: [addedFile] });

    expect(screen.getByText(/: 3$/)).toBeInTheDocument();
  });

  test('renders title with 0 count when no files', () => {
    const publication = createMockPublication([]);
    setup({ publication });

    expect(screen.getByText(/: 0$/)).toBeInTheDocument();
  });

  test('renders title with 0 when files is undefined', () => {
    const publication = createMockPublication();
    delete publication.files;
    setup({ publication });

    expect(screen.getByText(/: 0$/)).toBeInTheDocument();
  });

  test('renders FilesList component', () => {
    setup();

    expect(screen.getByRole('region', { name: 'files-list' })).toBeInTheDocument();
  });

  test('passes correct files to FilesList', () => {
    setup();

    expect(capturedFilesListProps.files).toHaveLength(2);
  });

  test('passes correct action to FilesList', () => {
    setup();

    expect(capturedFilesListProps.action).toBe(ActionType.ADD);
  });

  test('passes onChange handler to FilesList', () => {
    setup();

    expect(capturedFilesListProps.onChange).toBeDefined();
    expect(typeof capturedFilesListProps.onChange).toBe('function');
  });

  test('passes addedFiles to FilesList when provided', () => {
    const addedFile = new File(['content'], 'added.txt', { type: 'text/plain' });
    setup({ addedFiles: [addedFile] });

    expect(capturedFilesListProps.addedFiles).toHaveLength(1);
    expect(capturedFilesListProps.addedFiles[0].name).toBe('added.txt');
  });

  test('passes onRemoveAdded to FilesList', () => {
    setup();

    expect(capturedFilesListProps.onRemoveAdded).toBeDefined();
    expect(typeof capturedFilesListProps.onRemoveAdded).toBe('function');
  });

  test('renders Add button when addedFiles is provided', () => {
    setup({ addedFiles: [] });

    expect(screen.getByText('Buttons.Add')).toBeInTheDocument();
  });

  test('does not render Add button when addedFiles is not provided', () => {
    setup();

    expect(screen.queryByText('Buttons.Add')).not.toBeInTheDocument();
  });

  test('renders hidden file input when addedFiles is provided', () => {
    const { container } = setup({ addedFiles: [] });

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');
  });

  test('does not render hidden file input when addedFiles is not provided', () => {
    const { container } = setup();

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeInTheDocument();
  });

  test('clicking Add button triggers file input click', async () => {
    const { container } = setup({ addedFiles: [] });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    const addButton = screen.getByText('Buttons.Add');
    await userEvent.click(addButton);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  test('selecting a file via input calls setAddedFiles', async () => {
    const setAddedFiles = vi.fn((updater: any) => updater([]));
    const { container } = setup({ addedFiles: [], setAddedFiles });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['test content'], 'test-file.txt', { type: 'text/plain' });

    await userEvent.upload(fileInput, testFile);

    expect(setAddedFiles).toHaveBeenCalledTimes(1);
    expect(typeof setAddedFiles.mock.calls[0][0]).toBe('function');

    const updater = setAddedFiles.mock.calls[0][0];
    const result = updater([]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('test-file.txt');
  });

  test('file input appends to existing added files', async () => {
    const existingFile = new File(['existing'], 'existing.txt', { type: 'text/plain' });
    const setAddedFiles = vi.fn((updater: any) => updater([existingFile]));
    const { container } = setup({ addedFiles: [existingFile], setAddedFiles });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const newFile = new File(['new'], 'new-file.txt', { type: 'text/plain' });

    await userEvent.upload(fileInput, newFile);

    const updater = setAddedFiles.mock.calls[0][0];
    const result = updater([existingFile]);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('existing.txt');
    expect(result[1].name).toBe('new-file.txt');
  });

  test('file input value is cleared after selection', async () => {
    const setAddedFiles = vi.fn();
    const { container } = setup({ addedFiles: [], setAddedFiles });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['content'], 'file.txt', { type: 'text/plain' });

    await userEvent.upload(fileInput, testFile);

    expect(fileInput.value).toBe('');
  });

  test('handleFilesChange calls onChange with updated publication', () => {
    const onChange = vi.fn();
    setup({ onChange });

    const newFiles = [mockFiles[0]];
    capturedFilesListProps.onChange(newFiles);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.files).toEqual(newFiles);
    expect(updatedPublication.path).toBe('publications/test-publication');
    expect(updatedPublication.requestName).toBe('test-request');
    expect(updatedPublication.author).toBe('test@example.com');
  });

  test('handleFilesChange preserves all publication properties', () => {
    const onChange = vi.fn();
    const publication = createMockPublication();
    setup({ onChange, publication });

    capturedFilesListProps.onChange([]);

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.path).toBe(publication.path);
    expect(updatedPublication.requestName).toBe(publication.requestName);
    expect(updatedPublication.author).toBe(publication.author);
    expect(updatedPublication.displayAuthor).toBe(publication.displayAuthor);
    expect(updatedPublication.createdAt).toBe(publication.createdAt);
    expect(updatedPublication.status).toBe(publication.status);
    expect(updatedPublication.action).toBe(publication.action);
    expect(updatedPublication.folderId).toBe(publication.folderId);
  });

  test('onRemoveAdded calls setAddedFiles to remove file at index', () => {
    const file1 = new File(['a'], 'a.txt', { type: 'text/plain' });
    const file2 = new File(['b'], 'b.txt', { type: 'text/plain' });
    const setAddedFiles = vi.fn((updater: any) => updater([file1, file2]));
    setup({ addedFiles: [file1, file2], setAddedFiles });

    capturedFilesListProps.onRemoveAdded(0);

    expect(setAddedFiles).toHaveBeenCalledTimes(1);
    const updater = setAddedFiles.mock.calls[0][0];
    const result = updater([file1, file2]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('b.txt');
  });

  test('onRemoveAdded removes second file correctly', () => {
    const file1 = new File(['a'], 'a.txt', { type: 'text/plain' });
    const file2 = new File(['b'], 'b.txt', { type: 'text/plain' });
    const file3 = new File(['c'], 'c.txt', { type: 'text/plain' });
    const setAddedFiles = vi.fn((updater: any) => updater([file1, file2, file3]));
    setup({ addedFiles: [file1, file2, file3], setAddedFiles });

    capturedFilesListProps.onRemoveAdded(1);

    const updater = setAddedFiles.mock.calls[0][0];
    const result = updater([file1, file2, file3]);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('a.txt');
    expect(result[1].name).toBe('c.txt');
  });

  test('passes empty array to FilesList when publication.files is undefined', () => {
    const publication = createMockPublication();
    delete publication.files;
    setup({ publication });

    expect(capturedFilesListProps.files).toEqual([]);
  });

  test('renders with delete action', () => {
    const publication = createMockPublication();
    publication.action = ActionType.DELETE;
    setup({ publication });

    expect(capturedFilesListProps.action).toBe(ActionType.DELETE);
  });

  test('does not call onChange when onChange is not provided', () => {
    const { container } = render(<FilesDetails publication={createMockPublication()} setAddedFiles={vi.fn()} />);

    expect(container).toBeInTheDocument();

    // Should not throw when FilesList triggers onChange
    capturedFilesListProps.onChange?.([]);
  });

  test('renders with many files and added files', () => {
    const files = Array.from({ length: 5 }, (_, i) => ({
      sourceUrl: `source/file${i}.txt`,
      targetUrl: `target/file${i}.txt`,
      reviewUrl: `review/file${i}.txt`,
      action: ActionType.ADD,
      file: { name: `file${i}.txt`, path: `/path/file${i}.txt` },
    })) as PublicationFile[];

    const addedFiles = Array.from(
      { length: 3 },
      (_, i) => new File([`content-${i}`], `added-${i}.txt`, { type: 'text/plain' }),
    );

    const publication = createMockPublication(files);
    setup({ publication, addedFiles });

    expect(screen.getByText(/: 8$/)).toBeInTheDocument();
    expect(capturedFilesListProps.files).toHaveLength(5);
    expect(capturedFilesListProps.addedFiles).toHaveLength(3);
  });
});
