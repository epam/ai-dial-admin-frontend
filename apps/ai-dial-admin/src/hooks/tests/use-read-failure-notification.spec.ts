import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Override the global NotificationContext mock, whose showNotification is a fresh spy per call and so
// cannot be asserted against.
const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

import { useReadFailureNotification } from '@/src/hooks/use-read-failure-notification';
import { NotificationType } from '@/src/models/notification';
import { ReadFailure } from '@/src/models/server-action';

const FALLBACK_KEY = 'Analytics.SomethingLoadFailed';

const failure = (over: Partial<ReadFailure> = {}): ReadFailure => ({
  errorHeader: 'Upstream unavailable',
  errorMessage: 'evaluator registry timed out',
  requestId: 'trace-1',
  ...over,
});

beforeEach(() => {
  showNotification.mockClear();
});

describe('useReadFailureNotification', () => {
  test('reports the service header, message and request id', () => {
    renderHook(() => useReadFailureNotification(failure(), FALLBACK_KEY));

    expect(showNotification).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith({
      type: NotificationType.error,
      title: 'Upstream unavailable',
      description: 'evaluator registry timed out',
      requestId: 'trace-1',
      duration: null,
      customTitle: undefined,
    });
  });

  test('falls back to the title key only when the response carried no header', () => {
    renderHook(() => useReadFailureNotification(failure({ errorHeader: undefined }), FALLBACK_KEY));

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: FALLBACK_KEY, description: 'evaluator registry timed out' }),
    );
  });

  test('reports a failure carrying no words at all under the fallback title', () => {
    renderHook(() => useReadFailureNotification({}, FALLBACK_KEY));

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: FALLBACK_KEY, description: '', requestId: undefined }),
    );
  });

  test('raises nothing when there is no failure', () => {
    renderHook(() => useReadFailureNotification(null, FALLBACK_KEY));

    expect(showNotification).not.toHaveBeenCalled();
  });

  test('does not re-raise when an equal failure arrives as a new object', () => {
    const { rerender } = renderHook(({ read }) => useReadFailureNotification(read, FALLBACK_KEY), {
      initialProps: { read: failure() },
    });

    rerender({ read: failure() });
    rerender({ read: failure() });

    expect(showNotification).toHaveBeenCalledTimes(1);
  });

  test('re-raises when the failure changes', () => {
    const { rerender } = renderHook(({ read }) => useReadFailureNotification(read, FALLBACK_KEY), {
      initialProps: { read: failure() },
    });

    rerender({ read: failure({ requestId: 'trace-2' }) });

    expect(showNotification).toHaveBeenCalledTimes(2);
  });

  test('reports the same failure again after a read has succeeded in between', () => {
    const { rerender } = renderHook(
      ({ read }: { read: ReadFailure | null }) => useReadFailureNotification(read, FALLBACK_KEY),
      {
        initialProps: { read: failure() as ReadFailure | null },
      },
    );

    rerender({ read: null });
    rerender({ read: failure() });

    expect(showNotification).toHaveBeenCalledTimes(2);
  });
});
