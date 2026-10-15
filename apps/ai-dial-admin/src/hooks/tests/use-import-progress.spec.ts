import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ImportI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useImportProgress } from '@/src/hooks/use-import-progress';
import { NotificationType } from '@/src/models/notification';
import { ServerActionResponse } from '@/src/models/server-action';

const NOTIFICATION_ID = 'notification-id';
const { showNotification, removeNotification } = useNotification();

const GENERAL_FAILURE: ServerActionResponse = { success: false, errorHeader: ImportI18nKey.ImportFailed };

describe('useImportProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(showNotification).mockReturnValue(NOTIFICATION_ID);
  });

  test('shows a persistent in-progress notification while the request is pending', async () => {
    let resolveRequest: (response: ServerActionResponse) => void = () => {};
    const request = () => new Promise<ServerActionResponse>((resolve) => (resolveRequest = resolve));
    const { result } = renderHook(() => useImportProgress());

    let pending: Promise<ServerActionResponse> = Promise.resolve({ success: false });
    act(() => {
      pending = result.current('docs', request);
    });

    expect(showNotification).toHaveBeenCalledOnce();
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
      await pending;
    });
  });

  test('removes the notification and returns the response on success', async () => {
    const response: ServerActionResponse = { success: true, response: { importResults: [] } };
    const { result } = renderHook(() => useImportProgress());

    const res = await result.current('docs', () => Promise.resolve(response));

    expect(res).toBe(response);
    expect(removeNotification).toHaveBeenCalledOnce();
    expect(removeNotification).toHaveBeenCalledWith(NOTIFICATION_ID);
  });

  test('removes the notification and passes a failed response through', async () => {
    const response: ServerActionResponse = { success: false, errorHeader: 'Bad request', errorMessage: 'nope' };
    const { result } = renderHook(() => useImportProgress());

    const res = await result.current('docs', () => Promise.resolve(response));

    expect(res).toBe(response);
    expect(removeNotification).toHaveBeenCalledWith(NOTIFICATION_ID);
  });

  test('removes the notification and reports a general failure when the request throws', async () => {
    const { result } = renderHook(() => useImportProgress());

    const res = await result.current('docs', () => Promise.reject(new Error('network down')));

    expect(res).toEqual(GENERAL_FAILURE);
    expect(removeNotification).toHaveBeenCalledWith(NOTIFICATION_ID);
  });

  test('reports the same general failure for a non-Error rejection', async () => {
    const { result } = renderHook(() => useImportProgress());

    const res = await result.current('docs', () => Promise.reject('boom'));

    expect(res).toEqual(GENERAL_FAILURE);
    expect(removeNotification).toHaveBeenCalledWith(NOTIFICATION_ID);
  });
});
