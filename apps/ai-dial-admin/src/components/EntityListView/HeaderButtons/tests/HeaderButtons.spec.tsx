import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Override the global NotificationContext mock, whose spies are fresh per call and so cannot be asserted against.
const showNotification = vi.fn((_notification: Notification) => 'notification-id');
const removeNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification }),
}));

const protectedRequest = vi.fn();
vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest: () => protectedRequest,
}));

const formData = { body: new FormData(), fileSize: 0 };
vi.mock('@/src/components/EntityListView/HeaderButtons/utils', () => ({
  getFormDataForImport: vi.fn(() => formData),
  getImportFunction: vi.fn(() => vi.fn()),
  getImportTitle: vi.fn(() => 'Menu.Prompts'),
}));

vi.mock('@/src/hooks/use-is-tablet-screen', () => ({ useIsTabletScreen: () => false }));
vi.mock('@/src/components/ListView/Header/ResetFiltersButton', () => ({ default: () => null }));

vi.mock('@/src/components/EntityListView/Components/Modals', () => ({
  ModalType: { create: 'create', import: 'import' },
  default: ({ onImport }: { onImport: (type: string, file: object, strategy: string, path: string) => void }) => (
    <button onClick={() => onImport('json', {}, 'skip', 'prompts/docs/')}>confirm-import</button>
  ),
}));

import EntityListHeaderButtons from '@/src/components/EntityListView/HeaderButtons/HeaderButtons';
import { ImportI18nKey } from '@/src/constants/i18n';
import { Notification, NotificationType } from '@/src/models/notification';
import { ApplicationRoute } from '@/src/types/routes';

const MAX_FILE_SIZE_EXCEEDED = 10 * 1024 * 1024 * 1024;

const startImport = async () => {
  const user = userEvent.setup();
  render(<EntityListHeaderButtons route={ApplicationRoute.Prompts} toggleColumnsPanel={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'confirm-import' }));
};

describe('EntityListHeaderButtons import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formData.fileSize = 0;
  });

  test('shows a persistent in-progress notification for the destination folder while the request is pending', async () => {
    protectedRequest.mockReturnValue(new Promise(() => {}));

    await startImport();

    expect(protectedRequest).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.prepare,
        title: ImportI18nKey.InProgressTitle,
        duration: null,
      }),
    );
    expect(removeNotification).not.toHaveBeenCalled();
  });

  test('removes the in-progress notification before showing the import result', async () => {
    protectedRequest.mockResolvedValue({
      success: true,
      response: { importResults: [{ targetPath: 'prompts/docs/a', status: 'success' }] },
    });

    await startImport();

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.success })),
    );
    expect(removeNotification).toHaveBeenCalledWith('notification-id');
    const resultCallIndex = showNotification.mock.calls.findIndex(
      ([config]) => config.type === NotificationType.success,
    );
    expect(removeNotification.mock.invocationCallOrder[0]).toBeLessThan(
      showNotification.mock.invocationCallOrder[resultCallIndex],
    );
  });

  test('removes the in-progress notification and shows an error when the request throws', async () => {
    protectedRequest.mockRejectedValue(new Error('network down'));

    await startImport();

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.error, title: ImportI18nKey.ImportFailed, duration: null }),
      ),
    );
    expect(removeNotification).toHaveBeenCalledWith('notification-id');
  });

  test('shows only the size error and sends no request when the file exceeds the size limit', async () => {
    formData.fileSize = MAX_FILE_SIZE_EXCEEDED;

    await startImport();

    expect(protectedRequest).not.toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.error, title: ImportI18nKey.FileSizeErrorHeader }),
    );
  });
});
