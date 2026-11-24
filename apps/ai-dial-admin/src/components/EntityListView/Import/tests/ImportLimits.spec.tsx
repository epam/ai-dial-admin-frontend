import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ImportModal from '@/src/components/EntityListView/Import/ImportModal';
import { ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/components/EntityListView/Import/ImportConflicts', () => ({ default: () => null }));

const MIB = 1024 * 1024;
const jsonFile = (name: string, size: number) => {
  const file = new File(['{"prompts":[{"id":"prompts/public/test"}]}'], name, { type: 'application/json' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};
const archive = (size: number) => {
  const file = new File(['zip'], 'archive.zip', { type: 'application/zip' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};
const files = (count: number) => Array.from({ length: count }, (_, i) => jsonFile(`${i}.json`, 1));
const renderModal = (preselectedItems?: File[], route = ApplicationRoute.Prompts) =>
  render(<ImportModal isModalOpen onClose={vi.fn()} route={route} preselectedItems={preselectedItems} />);
const next = () => screen.getByRole('button', { name: ButtonsI18nKey.Next });
const pick = (label: string, selection: File[]) =>
  fireEvent.change(screen.getByLabelText(label), { target: { files: selection } });

describe('ImportModal size and count limits', () => {
  test.each([ApplicationRoute.Prompts, ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'accepts a preselected 64 MiB archive on %s',
    async (route) => {
      renderModal([archive(64 * MIB)], route);
      await waitFor(() => expect(next()).toBeEnabled());
    },
  );

  test('rejects a preselected archive one byte over the limit', async () => {
    renderModal([archive(64 * MIB + 1)]);
    expect((await screen.findByText(ImportI18nKey.ArchiveSizeErrorDescription)).closest('[role="alert"]')).toBeTruthy();
    expect(next()).toBeDisabled();
  });

  test('accepts a single preselected JSON file exactly at the limit', async () => {
    renderModal([jsonFile('boundary.json', 64 * MIB)]);
    await waitFor(() => expect(next()).toBeEnabled());
  });

  test('rejects a preselected JSON file one byte over the limit', async () => {
    renderModal([jsonFile('large.json', 64 * MIB + 1)]);
    expect(await screen.findByText(ImportI18nKey.FileSizeErrorDescription)).toBeInTheDocument();
    expect(next()).toBeDisabled();
  });

  test('accepts a batch totaling 64 MiB and rejects one byte more', async () => {
    const { rerender } = renderModal([jsonFile('a.json', 32 * MIB), jsonFile('b.json', 32 * MIB)]);
    await waitFor(() => expect(next()).toBeEnabled());
    rerender(
      <ImportModal
        isModalOpen
        onClose={vi.fn()}
        route={ApplicationRoute.Prompts}
        preselectedItems={[jsonFile('a.json', 32 * MIB), jsonFile('b.json', 32 * MIB + 1)]}
      />,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(ImportI18nKey.TotalFileSizeErrorDescription);
    expect(next()).toBeDisabled();
  });

  test('accepts 30 preselected files and shows all 31 with a count error', async () => {
    const { rerender } = renderModal(files(30));
    await waitFor(() => expect(next()).toBeEnabled());
    rerender(
      <ImportModal isModalOpen onClose={vi.fn()} route={ApplicationRoute.Prompts} preselectedItems={files(31)} />,
    );
    expect(await screen.findByText('30.json')).toBeInTheDocument();
    expect(screen.getByText(ImportI18nKey.JsonDescription)).toBeInTheDocument();
    expect(next()).toBeDisabled();
  });

  test('accepts a picker file exactly at 64 MiB and rejects one byte over', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('radio', { name: ImportI18nKey.DialCoreFiles }));
    pick(`${ImportI18nKey.Files}: 0`, [jsonFile('large.json', 64 * MIB + 1)]);
    expect(screen.getByRole('alert')).toHaveTextContent(ImportI18nKey.FileSizeErrorDescription);
    expect(next()).toBeDisabled();
    pick(`${ImportI18nKey.Files}: 0`, [jsonFile('boundary.json', 64 * MIB)]);
    await waitFor(() => expect(next()).toBeEnabled());
  });

  test('rejects a picker selection of 31 files without silently importing 30', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('radio', { name: ImportI18nKey.DialCoreFiles }));
    pick(`${ImportI18nKey.Files}: 0`, files(31));
    expect(screen.getByRole('alert')).toHaveTextContent(ImportI18nKey.JsonDescription);
    expect(next()).toBeDisabled();
  });

  test('rejects a dropped oversized archive', () => {
    renderModal();
    fireEvent.drop(screen.getByText(ImportI18nKey.DropAnyFile), { dataTransfer: { files: [archive(64 * MIB + 1)] } });
    expect(screen.getByRole('alert')).toHaveTextContent(ImportI18nKey.ArchiveSizeErrorDescription);
    expect(next()).toBeDisabled();
  });

  test('shows a total-size error after adding files and recovers after removal', async () => {
    const user = userEvent.setup();
    renderModal([jsonFile('a.json', 32 * MIB)]);
    await waitFor(() => expect(next()).toBeEnabled());
    pick(`${ImportI18nKey.Files}: 1`, [jsonFile('b.json', 32 * MIB + 1)]);
    expect(screen.getByRole('alert')).toHaveTextContent(ImportI18nKey.TotalFileSizeErrorDescription);
    expect(next()).toBeDisabled();
    await user.click(screen.getByRole('button', { name: `${ButtonsI18nKey.Delete}: b.json` }));
    await waitFor(() => expect(next()).toBeEnabled());
  });

  test('rejects Add and drop selections exceeding the count limit', async () => {
    renderModal(files(29));
    await waitFor(() => expect(next()).toBeEnabled());
    pick(`${ImportI18nKey.Files}: 29`, [jsonFile('new1.json', 1), jsonFile('new2.json', 1)]);
    expect(screen.getByRole('alert')).toHaveTextContent(ImportI18nKey.JsonDescription);
    expect(screen.queryByText('new1.json')).not.toBeInTheDocument();
    fireEvent.drop(screen.getByText('0.json'), {
      dataTransfer: { files: [jsonFile('new3.json', 1), jsonFile('new4.json', 1)] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(ImportI18nKey.JsonDescription);
    expect(screen.queryByText('new3.json')).not.toBeInTheDocument();
  });

  test('retains the Files route 100 MiB separate-files total limit', async () => {
    const first = new File(['x'], 'a.txt', { type: 'text/plain' });
    const second = new File(['x'], 'b.txt', { type: 'text/plain' });
    Object.defineProperty(first, 'size', { value: 50 * MIB });
    Object.defineProperty(second, 'size', { value: 50 * MIB });
    const { rerender } = renderModal([first, second], ApplicationRoute.Files);
    await waitFor(() => expect(next()).toBeEnabled());
    const extra = new File(['x'], 'extra.txt', { type: 'text/plain' });
    rerender(
      <ImportModal
        isModalOpen
        onClose={vi.fn()}
        route={ApplicationRoute.Files}
        preselectedItems={[first, second, extra]}
      />,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(ImportI18nKey.TotalFileSizeErrorDescription);
    expect(next()).toBeDisabled();
  });

  test('retains the Files route 100 MiB archive limit', async () => {
    const { rerender } = renderModal([archive(100 * MIB)], ApplicationRoute.Files);
    await waitFor(() => expect(next()).toBeEnabled());
    rerender(
      <ImportModal
        isModalOpen
        onClose={vi.fn()}
        route={ApplicationRoute.Files}
        preselectedItems={[archive(100 * MIB + 1)]}
      />,
    );
    expect(await screen.findByText(ImportI18nKey.ArchiveSizeErrorDescription)).toBeInTheDocument();
    expect(next()).toBeDisabled();
  });
});
