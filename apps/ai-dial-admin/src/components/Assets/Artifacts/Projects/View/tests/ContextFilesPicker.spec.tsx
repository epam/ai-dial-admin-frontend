import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ApiRoute } from '@/src/constants/api-routes';
import { ButtonsI18nKey, ProjectI18nKey } from '@/src/constants/i18n';
import ContextFilesPicker from '../ContextFilesPicker';

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

vi.mock('@/src/context/assets/FileFolderContext', () => ({
  FileFolderProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Stand-in for the file browser: reports a selection through the multi-select callback.
vi.mock('@/src/components/Common/EntitySelectInput/EntitySelectManager', () => ({
  default: ({ onChangeSelectedPaths }: { onChangeSelectedPaths?: (paths: string[]) => void }) => (
    <div>
      <button onClick={() => onChangeSelectedPaths?.(['public/a.csv', 'public/docs/b.pdf'])}>select-two</button>
      <button onClick={() => onChangeSelectedPaths?.([])}>select-none</button>
    </div>
  ),
}));

const fileResponse = (content: string, type = 'text/csv') =>
  new Response(content, { headers: { 'content-type': type } });

describe('ContextFilesPicker', () => {
  const onClose = vi.fn();
  const onPick = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderPicker = (isOpen = true) =>
    render(<ContextFilesPicker isOpen={isOpen} onClose={onClose} onPick={onPick} />);

  const confirmButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Confirm });

  test('shows the file browser under the select-files header when open', () => {
    renderPicker();

    expect(screen.getByText(ProjectI18nKey.SelectFiles)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'select-two' })).toBeTruthy();
  });

  test('renders nothing when closed', () => {
    renderPicker(false);

    expect(screen.queryByText(ProjectI18nKey.SelectFiles)).toBeNull();
  });

  test('keeps Confirm disabled until a file is selected', async () => {
    const user = userEvent.setup();
    renderPicker();

    expect(confirmButton().hasAttribute('disabled')).toBe(true);
    await user.click(screen.getByRole('button', { name: 'select-two' }));
    expect(confirmButton().hasAttribute('disabled')).toBe(false);
    await user.click(screen.getByRole('button', { name: 'select-none' }));
    expect(confirmButton().hasAttribute('disabled')).toBe(true);
  });

  test('downloads every selected file and hands them over named by their last path segment', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(url.includes('a.csv') ? fileResponse('a,b') : fileResponse('%PDF', 'application/pdf')),
    );
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: 'select-two' }));
    await user.click(confirmButton());

    await vi.waitFor(() => expect(onPick).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(`${ApiRoute.FilesDownload}?path=${encodeURIComponent('public/a.csv')}`);
    expect(fetchMock).toHaveBeenCalledWith(`${ApiRoute.FilesDownload}?path=${encodeURIComponent('public/docs/b.pdf')}`);
    const files = onPick.mock.calls[0][0] as File[];
    expect(files.map((file) => file.name)).toEqual(['a.csv', 'b.pdf']);
    expect(await files[0].text()).toBe('a,b');
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('reports a failed download and hands nothing over', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: 'select-two' }));
    await user.click(confirmButton());

    await vi.waitFor(() => expect(showNotification).toHaveBeenCalledOnce());
    expect(onPick).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('forgets the selection when cancelled', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: 'select-two' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(confirmButton().hasAttribute('disabled')).toBe(true);
  });
});
