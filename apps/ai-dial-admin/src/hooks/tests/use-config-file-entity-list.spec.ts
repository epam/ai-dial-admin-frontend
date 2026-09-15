import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ConfigFileFailureReason } from '@/src/types/config-file-entity';
import { useConfigFileEntityList } from '@/src/hooks/use-config-file-entity-list';

describe('useConfigFileEntityList', () => {
  test('issues no fetch while showConfigFiles is false', () => {
    const fetchList = vi.fn();

    renderHook(() => useConfigFileEntityList(false, fetchList));

    expect(fetchList).not.toHaveBeenCalled();
  });

  test('fetches once when showConfigFiles becomes true, and populates data', async () => {
    const fetchList = vi.fn().mockResolvedValue({ success: true, data: ['a'] });

    const { result, rerender } = renderHook(({ show }) => useConfigFileEntityList(show, fetchList), {
      initialProps: { show: false },
    });

    rerender({ show: true });

    await waitFor(() => expect(result.current.data).toEqual(['a']));
    expect(fetchList).toHaveBeenCalledOnce();
  });

  test('does not re-fetch on a later toggle-off/toggle-on', async () => {
    const fetchList = vi.fn().mockResolvedValue({ success: true, data: [] });

    const { rerender } = renderHook(({ show }) => useConfigFileEntityList(show, fetchList), {
      initialProps: { show: false },
    });

    rerender({ show: true });
    await waitFor(() => expect(fetchList).toHaveBeenCalledOnce());
    rerender({ show: false });
    rerender({ show: true });

    expect(fetchList).toHaveBeenCalledOnce();
  });

  test('leaves data empty on a failed read rather than throwing', async () => {
    const fetchList = vi.fn().mockResolvedValue({
      success: false,
      failure: { reason: ConfigFileFailureReason.RequestFailed },
    });

    const { result, rerender } = renderHook(({ show }) => useConfigFileEntityList(show, fetchList), {
      initialProps: { show: false },
    });

    rerender({ show: true });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });
});
