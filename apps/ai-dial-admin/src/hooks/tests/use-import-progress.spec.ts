import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Override the global NotificationContext mock, whose spies are fresh per call and so cannot be asserted against.
const showNotification = vi.fn(() => 'notification-id');
const removeNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification }),
}));

import { ImportI18nKey } from '@/src/constants/i18n';
import { useImportProgress } from '@/src/hooks/use-import-progress';
import { NotificationType } from '@/src/models/notification';

beforeEach(() => {
  showNotification.mockClear();
  removeNotification.mockClear();
});

describe('useImportProgress', () => {
  test('shows a persistent in-progress notification while the request is pending', async () => {
    let resolveRequest: (value: { success: boolean }) => void = () => {};
    const request = vi.fn(() => new Promise<{ success: boolean }>((resolve) => (resolveRequest = resolve)));
    const { result } = renderHook(() => useImportProgress());

    let promise: Promise<unknown> = Promise.resolve();
    act(() => {
      promise = result.current('docs', request);
    });

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.prepare,
        title: ImportI18nKey.InProgressTitle,
        duration: null,
      }),
    );
    expect(removeNotification).not.toHaveBeenCalled();

    await act(async () => {
      resolveRequest({ success: true });
      await promise;
    });
  });

  test('removes the notification and returns the response on success', async () => {
    const response = { success: true, response: { importResults: [] } };
    const { result } = renderHook(() => useImportProgress());

    const res = await result.current('docs', () => Promise.resolve(response));

    expect(res).toBe(response);
    expect(removeNotification).toHaveBeenCalledWith('notification-id');
  });

  test('removes the notification and passes a failed response through', async () => {
    const response = { success: false, errorHeader: 'Bad request', errorMessage: 'nope' };
    const { result } = renderHook(() => useImportProgress());

    const res = await result.current('docs', () => Promise.resolve(response));

    expect(res).toBe(response);
    expect(removeNotification).toHaveBeenCalledWith('notification-id');
  });

  test('removes the notification and reports a failure when the request throws', async () => {
    const { result } = renderHook(() => useImportProgress());

    const res = await result.current('docs', () => Promise.reject(new Error('network down')));

    expect(res).toEqual({ success: false, errorHeader: ImportI18nKey.ImportFailed });
    expect(removeNotification).toHaveBeenCalledWith('notification-id');
  });

  test('reports the same general failure for a non-Error rejection', async () => {
    const { result } = renderHook(() => useImportProgress());

    const res = await result.current('docs', () => Promise.reject('boom'));

    expect(res).toEqual({ success: false, errorHeader: ImportI18nKey.ImportFailed });
  });
});
