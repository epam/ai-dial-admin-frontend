import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Override the global NotificationContext mock, whose spies are fresh per call and so cannot be asserted against.
const showNotification = vi.fn(() => 'notification-id');
const removeNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification }),
}));

const importFilesMock = vi.fn();
vi.mock('@/src/utils/files/import-files', () => ({
  importFiles: (...args: unknown[]) => importFilesMock(...args),
}));

vi.mock('@/src/components/EntityListView/HeaderButtons/utils', () => ({
  getFormDataForImport: vi.fn(() => ({ body: new FormData(), fileSize: 0 })),
}));

vi.mock('@/src/components/Common/FileManager/FileManager', () => ({
  default: ({ customUploadFileAction }: { customUploadFileAction: () => void }) => (
    <button onClick={() => customUploadFileAction()}>open-import</button>
  ),
}));

vi.mock('@/src/components/Assets/BaseAssetList/Modals', () => ({
  default: ({
    modalType,
    onImport,
  }: {
    modalType: string | null;
    onImport: (type: string, file: File[], strategy: string, path: string) => void;
  }) =>
    modalType === 'import' ? <button onClick={() => onImport('files', [], 'skip', '')}>confirm-import</button> : null,
}));

import FilesList from '@/src/components/Assets/Files/List';
import { ImportI18nKey } from '@/src/constants/i18n';
import { NotificationType } from '@/src/models/notification';

const SUCCESS_RESPONSE = {
  success: true,
  response: { importResults: [{ targetPath: 'files/a.txt', status: 'success' }] },
};

const startImport = async () => {
  const user = userEvent.setup();
  render(<FilesList />);
  await user.click(screen.getByRole('button', { name: 'open-import' }));
  await user.click(screen.getByRole('button', { name: 'confirm-import' }));
};

const callOrder = (spy: ReturnType<typeof vi.fn>, matcher: (call: unknown[]) => boolean) =>
  spy.mock.invocationCallOrder[spy.mock.calls.findIndex(matcher)];

describe('FilesList import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows a persistent in-progress notification while the import request is pending', async () => {
    importFilesMock.mockReturnValue(new Promise(() => {}));

    await startImport();

    expect(showNotification).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.prepare,
        title: ImportI18nKey.InProgressTitle,
        duration: null,
      }),
    );
    expect(removeNotification).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'confirm-import' })).toBeNull();
  });

  test('removes the in-progress notification before showing the success notification', async () => {
    importFilesMock.mockResolvedValue(SUCCESS_RESPONSE);

    await startImport();

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.success })),
    );
    expect(removeNotification).toHaveBeenCalledWith('notification-id');
    expect(removeNotification.mock.invocationCallOrder[0]).toBeLessThan(
      callOrder(showNotification, ([config]) => (config as { type: string }).type === NotificationType.success),
    );
  });

  test('removes the in-progress notification and shows the error when the server rejects the import', async () => {
    importFilesMock.mockResolvedValue({
      success: false,
      errorHeader: 'Bad request',
      errorMessage: 'nope',
      requestId: 'trace-1',
    });

    await startImport();

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.error,
          title: 'Bad request',
          description: 'nope',
          requestId: 'trace-1',
        }),
      ),
    );
    expect(removeNotification).toHaveBeenCalledWith('notification-id');
  });

  test('removes the in-progress notification and shows an error when the request throws', async () => {
    importFilesMock.mockRejectedValue(new Error('network down'));

    await startImport();

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.error, title: ImportI18nKey.ImportFailed, duration: null }),
      ),
    );
    expect(removeNotification).toHaveBeenCalledWith('notification-id');
  });
});
