import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import DetailPage from '@/src/app/[lang]/platform-policies/[id]/page';
import { getPolicy } from '@/src/app/[lang]/platform-policies/actions';
import ListPage from '@/src/app/[lang]/platform-policies/page';
import PolicyAssetView from '@/src/components/Assets/Platform/Policies/View';

vi.mock('@/src/app/[lang]/platform-policies/actions', () => ({ getPolicy: vi.fn() }));
vi.mock('@/src/components/Assets/Platform/Policies/List', () => ({ default: vi.fn() }));
vi.mock('@/src/components/Assets/Platform/Policies/View', () => ({ default: vi.fn() }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
vi.mock('next/navigation', () => ({ notFound: () => notFound() }));

const renderDetail = (id = 'team-a%2Fcap') => DetailPage({ params: Promise.resolve({ id }) });

describe('platform-policies pages :: POLICIES_ENABLED', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.POLICIES_ENABLED;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('the list answers not-found while the flag is off', async () => {
    await expect(ListPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  test('the list renders while the flag is on', async () => {
    vi.stubEnv('POLICIES_ENABLED', 'true');

    const page = (await ListPage()) as { props: Record<string, unknown> };

    expect(page).toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  test('a detail address answers not-found while the flag is off, without reading Core', async () => {
    await expect(renderDetail()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(getPolicy).not.toHaveBeenCalled();
  });

  describe('with the flag on', () => {
    beforeEach(() => {
      vi.stubEnv('POLICIES_ENABLED', 'true');
    });

    test('reads the decoded policy path and passes the etag to the view', async () => {
      vi.mocked(getPolicy).mockResolvedValue({ etag: 'e1', response: { name: 'cap' } } as never);

      const page = (await renderDetail()) as { props: { children: { type: unknown; props: Record<string, unknown> } } };

      expect(getPolicy).toHaveBeenCalledWith('team-a/cap', expect.any(String));
      expect(page.props.children.type).toBe(PolicyAssetView);
      expect(page.props.children.props).toMatchObject({ etag: 'e1', originalPolicy: { name: 'cap' } });
    });

    test('answers not-found when the policy does not exist', async () => {
      vi.mocked(getPolicy).mockResolvedValue({ etag: 'e1', response: null } as never);

      await expect(renderDetail()).rejects.toThrow('NEXT_NOT_FOUND');
    });

    test('answers not-found when reading the policy throws', async () => {
      vi.mocked(getPolicy).mockRejectedValue(new Error('boom'));

      await expect(renderDetail()).rejects.toThrow('NEXT_NOT_FOUND');
    });
  });
});
