import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useAdminConsent } from '@/src/components/Assets/Entities/Apps/ResourceDependencies/use-admin-consent';

const { protectedRequest } = vi.hoisted(() => ({ protectedRequest: vi.fn() }));

vi.mock('@/src/hooks/use-protected-request', () => ({ useProtectedRequest: () => protectedRequest }));
vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  getAdminConsentStatus: vi.fn(),
  grantAdminConsent: vi.fn(),
  withdrawAdminConsent: vi.fn(),
}));

const renderConsent = async () => {
  const hook = renderHook(() => useAdminConsent('applications/app', 'etag'));
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
};

describe('useAdminConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('exposes the status of a successful read', async () => {
    protectedRequest.mockResolvedValue({ success: true, response: { consented: true } });

    const { result } = await renderConsent();

    expect(result.current).toMatchObject({ status: { consented: true }, hasFailed: false });
  });

  test('marks the read as failed when the request fails', async () => {
    protectedRequest.mockResolvedValue({ success: false });

    const { result } = await renderConsent();

    expect(result.current).toMatchObject({ status: undefined, hasFailed: true });
  });

  test('marks the read as failed when it succeeds without a response body', async () => {
    protectedRequest.mockResolvedValue({ success: true, response: undefined });

    const { result } = await renderConsent();

    expect(result.current).toMatchObject({ status: undefined, hasFailed: true });
  });
});
