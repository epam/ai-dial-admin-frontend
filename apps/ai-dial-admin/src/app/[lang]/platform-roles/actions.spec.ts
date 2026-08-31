import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi } from '@/src/app/api/api';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { bulkDeleteRoles, createRole, getRole, getRoles, removeRole, updateRole } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets role :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getRoles action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRoles('platform/');

    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROLE, 'platform/');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getRole action', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRole('platform/my-role', 'etag');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROLE, 'platform/my-role', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createRole action, stripping read-only projections', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createRole({
      name: 'my-role',
      path: 'platform/my-role',
      folderId: 'platform/',
      status: DialModelResourceStatus.Valid,
      costLimit: { minute: 10 },
    });

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROLE, 'my-role', {
      name: 'my-role',
      costLimit: { minute: 10 },
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createRole action, stripping a description the generic create form seeds but Role has no field for', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createRole({
      name: 'my-role',
      path: 'platform/my-role',
      folderId: 'platform/',
      description: '',
    } as any);

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROLE, 'my-role', { name: 'my-role' });
  });

  test('createRole propagates a Core rejection unchanged', async () => {
    const rejection = { success: false, errorHeader: 'Bad Request', errorMessage: 'invalid role' };
    (assetApi.put as any).mockResolvedValue(rejection);

    const result = await createRole({ name: 'my-role', path: 'platform/my-role', folderId: 'platform/' });

    expect(result).toBe(rejection);
  });

  test('Should call updateRole action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateRole({ name: 'my-role', path: 'platform/my-role', folderId: 'platform/' }, 'etag');

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.ROLE,
      'my-role',
      { name: 'my-role' },
      { etag: 'etag' },
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateRole action, stripping author/createdAt/updatedAt — Core metadata fields the read merges in, not `Role.class` fields', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updateRole(
      {
        name: 'qwe',
        path: 'platform/qwe',
        folderId: 'platform/',
        costLimit: { minute: 10, day: 100, week: 500, month: 1000 },
        share: { conversation: { invitation_ttl: 24, max_accepted_users: 5 } },
        author: 'Yauheni Osipau',
        createdAt: '1787660728755',
        updatedAt: '1787660728755',
      },
      'etag',
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.ROLE,
      'qwe',
      {
        name: 'qwe',
        costLimit: { minute: 10, day: 100, week: 500, month: 1000 },
        share: { conversation: { invitation_ttl: 24, max_accepted_users: 5 } },
      },
      { etag: 'etag' },
    );
  });

  test('Should call updateRole action, omitting a cost-limit token that was already dropped as unlimited rather than routing the sentinel through a lossy `Number` conversion', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updateRole(
      {
        name: 'qwe',
        path: 'platform/qwe',
        folderId: 'platform/',
        // `minute` is already absent here — `mergeRoleResource` dropped it on read (see
        // `normalizeRoleLimits`'s doc comment); Core defaults a missing token to `Long.MAX_VALUE`
        // itself, so there is nothing left for the write path to convert or preserve.
        costLimit: { day: 100, week: 500, month: 1000 },
      },
      'etag',
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.ROLE,
      'qwe',
      expect.objectContaining({ costLimit: { day: 100, week: 500, month: 1000 } }),
      { etag: 'etag' },
    );
  });

  test('Should call removeRole action', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeRole('platform/my-role', 'etag');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROLE, 'platform/my-role', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call bulkDeleteRoles action', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteRoles([{ path: 'platform/my-role' }]);

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.ROLE, 'platform/my-role');
    expect(result).toEqual({ success: true });
  });
});
