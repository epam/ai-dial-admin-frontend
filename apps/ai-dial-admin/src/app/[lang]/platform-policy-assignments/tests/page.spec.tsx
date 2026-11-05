import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import DetailPage from '@/src/app/[lang]/platform-policy-assignments/[id]/page';
import { getPolicyAssignment } from '@/src/app/[lang]/platform-policy-assignments/actions';
import ListPage from '@/src/app/[lang]/platform-policy-assignments/page';
import PolicyAssignmentAssetView from '@/src/components/Assets/Platform/PolicyAssignments/View';

vi.mock('@/src/app/[lang]/platform-policy-assignments/actions', () => ({ getPolicyAssignment: vi.fn() }));
vi.mock('@/src/components/Assets/Platform/PolicyAssignments/List', () => ({ default: vi.fn() }));
vi.mock('@/src/components/Assets/Platform/PolicyAssignments/View', () => ({ default: vi.fn() }));
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
vi.mock('next/navigation', () => ({ notFound: () => notFound() }));

const renderDetail = (id = 'team-a%2Fgrant-1') => DetailPage({ params: Promise.resolve({ id }) });

describe('platform-policy-assignments pages :: POLICIES_ENABLED', () => {
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

    expect(await ListPage()).toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  test('a detail address answers not-found while the flag is off, without reading Core', async () => {
    await expect(renderDetail()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(getPolicyAssignment).not.toHaveBeenCalled();
  });

  describe('with the flag on', () => {
    beforeEach(() => {
      vi.stubEnv('POLICIES_ENABLED', 'true');
    });

    test('reads the decoded assignment path and passes the etag to the view', async () => {
      vi.mocked(getPolicyAssignment).mockResolvedValue({ etag: 'e1', response: { name: 'grant-1' } } as never);

      const page = (await renderDetail()) as { props: { children: { type: unknown; props: Record<string, unknown> } } };

      expect(getPolicyAssignment).toHaveBeenCalledWith('team-a/grant-1', expect.any(String));
      expect(page.props.children.type).toBe(PolicyAssignmentAssetView);
      expect(page.props.children.props).toMatchObject({ etag: 'e1', originalAssignment: { name: 'grant-1' } });
    });

    test('answers not-found when the assignment does not exist', async () => {
      vi.mocked(getPolicyAssignment).mockResolvedValue({ etag: 'e1', response: null } as never);

      await expect(renderDetail()).rejects.toThrow('NEXT_NOT_FOUND');
    });

    test('answers not-found when reading the assignment throws', async () => {
      vi.mocked(getPolicyAssignment).mockRejectedValue(new Error('boom'));

      await expect(renderDetail()).rejects.toThrow('NEXT_NOT_FOUND');
    });
  });
});
