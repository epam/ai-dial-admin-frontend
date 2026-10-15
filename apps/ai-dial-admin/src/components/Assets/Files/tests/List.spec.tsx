import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

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
import { useNotification } from '@/src/context/NotificationContext';
import { NotificationType } from '@/src/models/notification';

const { showNotification, removeNotification } = useNotification();

const SUCCESS_RESPONSE = {
  success: true,
  response: { importResults: [{ targetPath: 'files/a.txt', status: 'success' }] },
};

describe('FilesList', () => {
  // The order notifications are shown and removed in, as `show:<type>` / `remove` entries.
  let events: string[];

  const startImport = async () => {
    const user = userEvent.setup();
    render(<FilesList />);
    await user.click(screen.getByRole('button', { name: 'open-import' }));
    await user.click(screen.getByRole('button', { name: 'confirm-import' }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    events = [];
    vi.mocked(showNotification).mockImplementation((notification) => {
      events.push(`show:${notification.type}`);
      return 'notification-id';
    });
    vi.mocked(removeNotification).mockImplementation(() => {
      events.push('remove');
    });
  });

  describe('import', () => {
    test('closes the modal and shows a persistent in-progress notification while the request is pending', async () => {
      importFilesMock.mockReturnValue(new Promise(() => {}));

      await startImport();

      expect(screen.queryByRole('button', { name: 'confirm-import' })).toBeNull();
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

    test('removes the in-progress notification before showing the success notification', async () => {
      importFilesMock.mockResolvedValue(SUCCESS_RESPONSE);

      await startImport();

      await vi.waitFor(() => expect(events).toEqual(['show:prepare', 'remove', 'show:success']));
    });

    test('removes the in-progress notification and shows the error when the server rejects the import', async () => {
      importFilesMock.mockResolvedValue({
        success: false,
        errorHeader: 'Bad request',
        errorMessage: 'nope',
        requestId: 'trace-1',
      });

      await startImport();

      await vi.waitFor(() => {
        expect(events).toEqual(['show:prepare', 'remove', 'show:error']);
        expect(showNotification).toHaveBeenLastCalledWith(
          expect.objectContaining({
            type: NotificationType.error,
            title: 'Bad request',
            description: 'nope',
            requestId: 'trace-1',
          }),
        );
      });
    });

    test('removes the in-progress notification and shows a persistent general error when the request throws', async () => {
      importFilesMock.mockRejectedValue(new Error('network down'));

      await startImport();

      await vi.waitFor(() => {
        expect(events).toEqual(['show:prepare', 'remove', 'show:error']);
        expect(showNotification).toHaveBeenLastCalledWith(
          expect.objectContaining({ type: NotificationType.error, title: ImportI18nKey.ImportFailed, duration: null }),
        );
      });
    });
  });
});
