import { useRouter } from 'next/navigation';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useIframeSaveFeedback } from '@/src/components/EntityView/hooks/use-iframe-save-feedback';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { NotificationType } from '@/src/models/notification';
import { ApplicationRoute } from '@/src/types/routes';

const refresh = vi.fn();
const onSaved = vi.fn();
const showNotification = vi.mocked(useNotification().showNotification);

const renderFeedback = () =>
  renderHook(() => useIframeSaveFeedback({ view: ApplicationRoute.Applications, entityName: 'quick-app', onSaved }));

describe('useIframeSaveFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh } as unknown as ReturnType<typeof useRouter>);
  });

  test('runs onSaved, notifies and refreshes on success', () => {
    const { result } = renderFeedback();

    result.current.onIframeSaveSuccess();

    expect(onSaved).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.success }));
    expect(refresh).toHaveBeenCalledOnce();
  });

  test('notifies with the error text on failure', () => {
    const { result } = renderFeedback();

    result.current.onIframeSaveError('boom');

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.error,
        title: EntitiesI18nKey.IframeSaveFailed,
        description: 'boom',
      }),
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  test('notifies without a description when no error text is carried', () => {
    const { result } = renderFeedback();

    result.current.onIframeSaveError();

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: EntitiesI18nKey.IframeSaveFailed, description: '' }),
    );
  });
});
