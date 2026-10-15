import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const protectedRequest = vi.fn();
vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest: () => protectedRequest,
}));

vi.mock('@/src/components/EntityListView/HeaderButtons/utils', () => ({
  getFormDataForImport: vi.fn(),
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
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/utils';
import { ImportI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { NotificationType } from '@/src/models/notification';
import { ApplicationRoute } from '@/src/types/routes';

const { showNotification, removeNotification } = useNotification();

const MAX_FILE_SIZE_EXCEEDED = 10 * 1024 * 1024 * 1024;

describe('EntityListHeaderButtons', () => {
  // The order notifications are shown and removed in, as `show:<type>` / `remove` entries.
  let events: string[];

  const startImport = async () => {
    const user = userEvent.setup();
    render(<EntityListHeaderButtons route={ApplicationRoute.Prompts} toggleColumnsPanel={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'confirm-import' }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    events = [];
    vi.mocked(getFormDataForImport).mockReturnValue({ body: new FormData(), fileSize: 0 });
    vi.mocked(showNotification).mockImplementation((notification) => {
      events.push(`show:${notification.type}`);
      return 'notification-id';
    });
    vi.mocked(removeNotification).mockImplementation(() => {
      events.push('remove');
    });
  });

  describe('import', () => {
    test('shows a persistent in-progress notification while the request is pending', async () => {
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

      await vi.waitFor(() => expect(events).toEqual(['show:prepare', 'remove', 'show:success']));
    });

    test('removes the in-progress notification and shows a persistent general error when the request throws', async () => {
      protectedRequest.mockRejectedValue(new Error('network down'));

      await startImport();

      await vi.waitFor(() => {
        expect(events).toEqual(['show:prepare', 'remove', 'show:error']);
        expect(showNotification).toHaveBeenLastCalledWith(
          expect.objectContaining({ type: NotificationType.error, title: ImportI18nKey.ImportFailed, duration: null }),
        );
      });
    });

    test('shows only the size error and sends no request when the file exceeds the size limit', async () => {
      vi.mocked(getFormDataForImport).mockReturnValue({ body: new FormData(), fileSize: MAX_FILE_SIZE_EXCEEDED });

      await startImport();

      expect(protectedRequest).not.toHaveBeenCalled();
      expect(showNotification).toHaveBeenCalledOnce();
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.error, title: ImportI18nKey.FileSizeErrorHeader }),
      );
    });
  });
});
