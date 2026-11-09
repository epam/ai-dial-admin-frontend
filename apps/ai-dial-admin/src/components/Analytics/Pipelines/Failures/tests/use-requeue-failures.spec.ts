import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { requeueFailure } from '@/src/app/[lang]/pipelines/actions';
import { useRequeueFailures } from '@/src/components/Analytics/Pipelines/Failures/use-requeue-failures';

vi.mock('@/src/app/[lang]/pipelines/actions');

describe('useRequeueFailures', () => {
  const onRequeued = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    onRequeued.mockResolvedValue(undefined);
    vi.mocked(requeueFailure).mockResolvedValue({ success: true, response: { requeued: 1 } });
  });

  test('sends one request for two re-runs started in the same render', async () => {
    const { result } = renderHook(() => useRequeueFailures({ pipelineName: 'p', isPaused: false, onRequeued }));

    await act(async () => {
      await Promise.all([result.current.retryOne(1), result.current.retryOne(1)]);
    });

    expect(requeueFailure).toHaveBeenCalledOnce();
    expect(result.current.isBusy).toBe(false);
  });
});
