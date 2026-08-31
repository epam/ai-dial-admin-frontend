import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi } from '@/src/app/api/api';
import { DialKeyResource } from '@/src/models/dial/resource';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { bulkDeleteKeys, createKey, getKey, getKeys, removeKey, rotateKey, updateKey } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

const key = (overrides: Partial<DialKeyResource> = {}): DialKeyResource =>
  ({
    name: 'my-key',
    path: 'platform/my-key',
    folderId: 'platform/',
    ...overrides,
  }) as DialKeyResource;

describe('Assets key :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getKeys action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getKeys('platform/');

    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROJECT_KEY, 'platform/');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getKey action', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getKey('platform/my-key', 'etag');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.PROJECT_KEY,
      'platform/my-key',
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createKey action with key field included', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createKey(key({ key: 'generated-secret' }));

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROJECT_KEY, 'my-key', {
      key: 'generated-secret',
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createKey action, stripping read-only projections', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createKey(
      key({
        key: 'generated-secret',
        status: 'VALID' as any,
        path: 'platform/my-key',
        folderId: 'platform/',
        author: 'someone',
        description: 'should be stripped',
      }),
    );

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROJECT_KEY, 'my-key', {
      key: 'generated-secret',
    });
  });

  test('createKey propagates a Core rejection unchanged', async () => {
    const rejection = { success: false, errorHeader: 'Bad Request', errorMessage: 'invalid key' };
    (assetApi.put as any).mockResolvedValue(rejection);

    const result = await createKey(key({ key: 'generated-secret' }));

    expect(result).toBe(rejection);
  });

  test('Should call updateKey action without key field', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateKey(key({ project: 'my-project' }), 'etag');

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.PROJECT_KEY,
      'my-key',
      { project: 'my-project' },
      { etag: 'etag' },
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateKey action, stripping author/createdAt/updatedAt metadata fields', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updateKey(
      key({
        author: 'someone',
        createdAt: '1787660728755',
        updatedAt: '1787660728755',
        secured: true,
        description: 'should be stripped',
      }),
      'etag',
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.PROJECT_KEY,
      'my-key',
      { secured: true },
      { etag: 'etag' },
    );
  });

  test('Should call updateKey action, omitting key field so Core preserves the existing secret', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updateKey(key({ key: 'some-secret', project: 'proj' }), 'etag');

    const [, , , payload] = (assetApi.put as any).mock.calls[0];
    expect(payload).not.toHaveProperty('key');
    expect(payload).toHaveProperty('project', 'proj');
  });

  test('Should call rotateKey action with key field included', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await rotateKey(key({ key: 'new-secret' }), 'etag');

    const [, , , payload, opts] = (assetApi.put as any).mock.calls[0];
    expect(payload).toHaveProperty('key', 'new-secret');
    expect(opts).toEqual({ etag: 'etag' });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeKey action', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeKey('platform/my-key', 'etag');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROJECT_KEY, 'platform/my-key', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call bulkDeleteKeys action', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteKeys([{ path: 'platform/my-key' }]);

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROJECT_KEY, 'platform/my-key');
    expect(result).toEqual({ success: true });
  });
});
