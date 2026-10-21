import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { isUnreachableResponse } from '@/src/utils/api/is-unreachable-response';

describe('isUnreachableResponse', () => {
  test('is true for the envelope useProtectedRequest builds when the call is rejected', async () => {
    const { result } = renderHook(() => useProtectedRequest());

    const res = await result.current(() => Promise.reject(new Error('fetch failed')));

    expect(isUnreachableResponse(res)).toBe(true);
  });

  test('is false for a failure the service answered', () => {
    expect(isUnreachableResponse({ success: false, status: 422, errorMessage: 'refused' })).toBe(false);
  });

  test('is false for a success', () => {
    expect(isUnreachableResponse({ success: true })).toBe(false);
  });
});
