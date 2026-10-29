import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ApiRoute } from '@/src/constants/api-routes';
import { ButtonsI18nKey, ProjectI18nKey } from '@/src/constants/i18n';
import { ProjectContextLimits } from '@/src/models/project-context';
import ContextFiles from '../ContextFiles';

vi.mock('../ContextFilesPicker', () => ({
  default: ({ isOpen, onPick }: { isOpen: boolean; onPick: (files: File[]) => void }) =>
    isOpen ? (
      <div role="region" aria-label="storage-picker">
        <button
          onClick={() =>
            onPick([new File(['x'], 'fresh.csv'), new File(['x'], 'taken.csv'), new File(['x'], 'notes.txt')])
          }
        >
          pick-files
        </button>
      </div>
    ) : null,
}));

const LIMITS: ProjectContextLimits = {
  allowedExtensions: ['csv', 'pdf'],
  maxFileBytes: 1000,
  maxTotalBytes: 2000,
  maxFiles: 100,
};

const renderContext = (props?: Partial<React.ComponentProps<typeof ContextFiles>>) => {
  const handlers = {
    onAddFiles: vi.fn(),
    onRemoveStoredFile: vi.fn(),
    onRemoveAddedFile: vi.fn(),
  };
  render(
    <ContextFiles
      projectPath="public/my-project"
      storedFiles={[]}
      addedFiles={[]}
      removedFileNames={[]}
      limits={LIMITS}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

const addInput = () => screen.getByLabelText(ButtonsI18nKey.Add, { selector: 'input' });

describe('ContextFiles', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders the named Context section and the capacity meter', () => {
    renderContext();

    expect(screen.getByRole('region', { name: ProjectI18nKey.Context })).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: ProjectI18nKey.CapacityMeterLabel })).toBeTruthy();
  });

  test('lists stored files and hides the ones staged for removal', () => {
    renderContext({
      storedFiles: [{ name: 'a.csv' }, { name: 'b.pdf' }],
      removedFileNames: ['b.pdf'],
    });

    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.queryByText('b')).toBeNull();
  });

  test('offers no preview for a stored file', () => {
    renderContext({ storedFiles: [{ name: 'a.csv' }] });

    expect(
      screen.getAllByRole('button').some((button) => /preview/i.test(button.getAttribute('aria-label') ?? '')),
    ).toBe(false);
  });

  test('downloads a stored file through the projects route without leaving the page', async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderContext({ storedFiles: [{ name: 'a.csv' }] });

    await user.click(screen.getByRole('button', { name: ProjectI18nKey.DownloadFile }));

    expect(open).toHaveBeenCalledWith(
      `${ApiRoute.ProjectsDownload}?path=public%2Fmy-project&filePath=context%2Fa.csv`,
      '_self',
      'noopener,noreferrer',
    );
  });

  test('offers no download for a file that is only staged', () => {
    renderContext({ addedFiles: [new File(['x'], 'new.csv')] });

    expect(screen.queryByRole('button', { name: ProjectI18nKey.DownloadFile })).toBeNull();
    expect(screen.getByRole('button', { name: ProjectI18nKey.RemoveFile })).toBeTruthy();
  });

  test('shows a stored file as a tile with its type and size', () => {
    renderContext({ storedFiles: [{ name: 'report.pdf', size: 2048 }] });

    expect(screen.getByText('report')).toBeTruthy();
    expect(screen.getByText('PDF · 2 KB')).toBeTruthy();
  });

  test('offers adding from the device and from file storage', async () => {
    const user = userEvent.setup();
    renderContext();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(await screen.findByText(ProjectI18nKey.AddFromDevice)).toBeTruthy();
    expect(screen.getByText(ProjectI18nKey.AddFromStorage)).toBeTruthy();
  });

  test('opens the file storage picker from the add menu', async () => {
    const user = userEvent.setup();
    renderContext();
    expect(screen.queryByRole('region', { name: 'storage-picker' })).toBeNull();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));
    await user.click(await screen.findByText(ProjectI18nKey.AddFromStorage));

    expect(await screen.findByRole('region', { name: 'storage-picker' })).toBeTruthy();
  });

  test('stages files picked from storage through the same checks as an upload', async () => {
    const user = userEvent.setup();
    const { onAddFiles } = renderContext({ storedFiles: [{ name: 'taken.csv' }] });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));
    await user.click(await screen.findByText(ProjectI18nKey.AddFromStorage));
    await user.click(await screen.findByRole('button', { name: 'pick-files' }));

    // `fresh.csv` is staged; `taken.csv` repeats a stored name and `notes.txt` is not an allowed type.
    expect(onAddFiles).toHaveBeenCalledWith([expect.objectContaining({ name: 'fresh.csv' })]);
    expect(screen.getAllByText(ProjectI18nKey.RejectedDuplicate).length).toBeGreaterThan(0);
    expect(screen.getAllByText(ProjectI18nKey.RejectedExtension).length).toBeGreaterThan(0);
  });

  test('stages an allowed file through the add input', async () => {
    const user = userEvent.setup();
    const { onAddFiles } = renderContext();
    const file = new File(['x'], 'notes.csv');

    await user.upload(addInput(), file);

    expect(onAddFiles).toHaveBeenCalledWith([file]);
    expect(await screen.findByText(ProjectI18nKey.FilesAddedStatus)).toBeTruthy();
  });

  test('does not stage a file with a disallowed extension and says why', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { onAddFiles } = renderContext();

    await user.upload(addInput(), new File(['x'], 'notes.txt'));

    expect(onAddFiles).not.toHaveBeenCalled();
    expect(screen.getAllByText(ProjectI18nKey.RejectedExtension).length).toBeGreaterThan(0);
  });

  test('rejects a file with the name of one already stored', async () => {
    const user = userEvent.setup();
    const { onAddFiles } = renderContext({ storedFiles: [{ name: 'a.csv' }] });

    await user.upload(addInput(), new File(['x'], 'a.csv'));

    expect(onAddFiles).not.toHaveBeenCalled();
    expect(screen.getAllByText(ProjectI18nKey.RejectedDuplicate).length).toBeGreaterThan(0);
  });

  test('allows re-adding a name whose stored file is staged for removal', async () => {
    const user = userEvent.setup();
    const { onAddFiles } = renderContext({ storedFiles: [{ name: 'a.csv' }], removedFileNames: ['a.csv'] });

    await user.upload(addInput(), new File(['x'], 'a.csv'));

    expect(onAddFiles).toHaveBeenCalled();
  });

  test('removes a stored file and announces it', async () => {
    const user = userEvent.setup();
    const { onRemoveStoredFile } = renderContext({ storedFiles: [{ name: 'a.csv' }] });

    await user.click(screen.getByRole('button', { name: ProjectI18nKey.RemoveFile }));

    expect(onRemoveStoredFile).toHaveBeenCalledWith('a.csv');
    expect(await screen.findByText(ProjectI18nKey.FileRemovedStatus)).toBeTruthy();
  });

  test('removes a staged file by index', async () => {
    const user = userEvent.setup();
    const { onRemoveAddedFile } = renderContext({ addedFiles: [new File(['x'], 'new.csv')] });

    await user.click(screen.getByRole('button', { name: ProjectI18nKey.RemoveFile }));

    expect(onRemoveAddedFile).toHaveBeenCalledWith(0);
  });

  test('offers no remove button and disables adding when disabled', () => {
    renderContext({ storedFiles: [{ name: 'a.csv' }], disabled: true });

    expect(screen.queryByRole('button', { name: ProjectI18nKey.RemoveFile })).toBeNull();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add }).hasAttribute('disabled')).toBe(true);
  });

  test('reports the used share of the total capacity', () => {
    renderContext({ addedFiles: [new File([new Uint8Array(1000)], 'half.csv')] });

    expect(
      screen.getByRole('progressbar', { name: ProjectI18nKey.CapacityMeterLabel }).getAttribute('aria-valuenow'),
    ).toBe('50');
  });
});
