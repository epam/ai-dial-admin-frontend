import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import FileUploadField from '@/src/components/Common/FileUploadField/FileUploadField';
import { FileUploadFieldProps } from '@/src/components/Common/FileUploadField/models';
import { ButtonsI18nKey } from '@/src/constants/i18n';

const BYTES_IN_MB = 1024 * 1024;

const makeFile = (name: string, type = 'application/json', sizeMb = 0): File => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: sizeMb * BYTES_IN_MB });
  return file;
};

const renderField = (props: Partial<FileUploadFieldProps> = {}) => {
  const onChange = vi.fn();
  const view = render(
    <FileUploadField
      fieldTitle="Files"
      elementId="files"
      acceptTypes="application/json"
      emptyTextFirstLine="Drop files"
      emptyTextSecondLine="or"
      emptyButtonLabel="Browse"
      fileFormatError="Only JSON"
      fileCountError="Too many"
      fileSizeError="Too big"
      multiFilesSizeError="Total too big"
      errorText="File error"
      deleteAllButtonLabel="Delete all"
      addButtonLabel="Add"
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange, ...view };
};

const pick = (input: HTMLElement, files: File[]) => fireEvent.change(input, { target: { files } });

describe('FileUploadField empty state', () => {
  test('Should show the label, the drop copy and no file rows', () => {
    renderField();

    expect(screen.getByText('Files: 0')).toBeInTheDocument();
    expect(screen.getByText('Drop files')).toBeInTheDocument();
    expect(screen.getByText('or Browse')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete all' })).not.toBeInTheDocument();
  });

  test('Should omit the count for a single-file field', () => {
    renderField({ multiple: false });

    expect(screen.getByText('Files')).toBeInTheDocument();
  });

  test('Should pass a valid pick to onChange', () => {
    const { onChange } = renderField();
    const file = makeFile('a.json');

    pick(screen.getByLabelText('Files: 0'), [file]);

    expect(onChange).toHaveBeenCalledWith([file]);
  });

  test('Should report a dropped file of the wrong format and not call onChange', () => {
    const { onChange } = renderField();

    fireEvent.drop(screen.getByText('Drop files'), { dataTransfer: { files: [makeFile('a.txt', 'text/plain')] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getAllByText('Only JSON').length).toBeGreaterThan(0);
    expect(screen.getByRole('alert')).toHaveTextContent('Only JSON');
  });

  test('Should reject a whole mixed drop', () => {
    const { onChange } = renderField();

    fireEvent.drop(screen.getByText('Drop files'), {
      dataTransfer: { files: [makeFile('a.json'), makeFile('b.txt', 'text/plain')] },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Only JSON');
  });

  test('Should report more files than the limit', () => {
    const { onChange } = renderField({ maxFilesCount: 1 });

    pick(screen.getByLabelText('Files: 0'), [makeFile('a.json'), makeFile('b.json')]);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Too many');
  });

  test('Should take only the first file for a single-file field', () => {
    const { onChange } = renderField({ multiple: false });
    const first = makeFile('a.json');

    pick(screen.getByLabelText('Files'), [first, makeFile('b.json')]);

    expect(onChange).toHaveBeenCalledWith([first]);
  });

  test('Should report a file over the size limit', () => {
    const { onChange } = renderField({ maxFileSize: 1 });

    pick(screen.getByLabelText('Files: 0'), [makeFile('a.json', 'application/json', 2)]);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Too big');
  });

  test('Should clear the error on the next valid pick', () => {
    const { onChange } = renderField({ maxFileSize: 1 });
    const input = screen.getByLabelText('Files: 0');

    pick(input, [makeFile('a.json', 'application/json', 2)]);
    expect(screen.getByRole('alert')).toHaveTextContent('Too big');
    pick(input, [makeFile('b.json')]);

    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    expect(onChange).toHaveBeenCalledOnce();
  });
});

describe('FileUploadField filled state', () => {
  const files = [makeFile('a.json'), makeFile('b.json')];

  test('Should show a row per file with the count and no drop area', () => {
    renderField({ files });

    expect(screen.getByText('Files: 2')).toBeInTheDocument();
    expect(screen.getByText('a.json')).toBeInTheDocument();
    expect(screen.getByText('b.json')).toBeInTheDocument();
    expect(screen.queryByText('Drop files')).not.toBeInTheDocument();
  });

  test('Should remove one file', async () => {
    const { onChange } = renderField({ files });

    await userEvent.setup().click(screen.getByRole('button', { name: `${ButtonsI18nKey.Delete}: a.json` }));

    expect(onChange).toHaveBeenCalledWith([files[1]]);
  });

  test('Should delete all', async () => {
    const { onChange } = renderField({ files });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Delete all' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  test('Should append files picked through Add', () => {
    const { onChange } = renderField({ files });
    const added = makeFile('c.json');

    pick(screen.getByLabelText('Files: 2'), [added]);

    expect(onChange).toHaveBeenCalledWith([...files, added]);
  });

  test('Should append files dropped on the list', () => {
    const { onChange } = renderField({ files });
    const dropped = makeFile('c.json');

    fireEvent.drop(screen.getByText('a.json'), { dataTransfer: { files: [dropped] } });

    expect(onChange).toHaveBeenCalledWith([...files, dropped]);
  });

  test('Should hide Add once the limit is reached', () => {
    renderField({ files, maxFilesCount: 2 });

    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
  });

  test('Should omit the action buttons without labels', () => {
    renderField({ files, addButtonLabel: undefined, deleteAllButtonLabel: undefined });

    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete all' })).not.toBeInTheDocument();
  });

  test('Should hide the actions of a single-file field and keep remove', () => {
    renderField({ files: [files[0]], multiple: false });

    expect(screen.queryByRole('button', { name: 'Delete all' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${ButtonsI18nKey.Delete}: a.json` })).toBeInTheDocument();
  });

  test('Should reject an Add that would exceed the count limit', () => {
    const { onChange } = renderField({ files: [files[0]], maxFilesCount: 1 });

    pick(screen.getByLabelText('Files: 1'), [makeFile('c.json')]);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Too many');
  });

  test('Should mark an invalid file and show its error text', () => {
    renderField({ files, isInvalid: (file) => file.name === 'b.json' });

    expect(screen.getAllByText('File error')).toHaveLength(1);
  });

  test('Should show the total size error while the combined size is over the limit', () => {
    renderField({
      files: [makeFile('a.json', 'application/json', 2), makeFile('b.json', 'application/json', 2)],
      maxMultiFilesSize: 3,
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Total too big');
    expect(screen.getAllByText('Total too big')).toHaveLength(2);
  });

  test('Should use the dynamic icon for each file', () => {
    renderField({ files, dynamicIcon: (name) => <span data-testid={`icon-${name}`} /> });

    expect(screen.getByTestId('icon-a.json')).toBeInTheDocument();
    expect(screen.getByTestId('icon-b.json')).toBeInTheDocument();
  });

  test('Should render additional action buttons', () => {
    renderField({ files, additionalActionButtons: <button type="button">Upload</button> });

    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
  });
});
