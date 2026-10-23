import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { SHOW_HIDDEN_FILES_STORAGE_KEY_PREFIX } from '../constants';
import { useShowHiddenFiles } from '../use-show-hidden-files';

const VIEW = 'files';
const STORAGE_KEY = `${SHOW_HIDDEN_FILES_STORAGE_KEY_PREFIX}:${VIEW}`;

describe('useShowHiddenFiles', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('defaults to hidden when nothing is stored', () => {
    const { result } = renderHook(() => useShowHiddenFiles(VIEW));

    expect(result.current[0]).toBe(false);
  });

  test('restores the stored value after mount', async () => {
    localStorage.setItem(STORAGE_KEY, 'true');

    const { result } = renderHook(() => useShowHiddenFiles(VIEW));

    await waitFor(() => expect(result.current[0]).toBe(true));
  });

  test('stores the new value when it changes', () => {
    const { result } = renderHook(() => useShowHiddenFiles(VIEW));

    act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  test('keeps the in-memory value when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useShowHiddenFiles(VIEW));

    act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);
  });
});
