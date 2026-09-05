import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi } from '@/src/app/api/api';
import { DialPlatformApplicationResource } from '@/src/models/dial/resource';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeletePlatformApplications,
  createPlatformApplication,
  getPlatformApplication,
  getPlatformApplications,
  removePlatformApplication,
  updatePlatformApplication,
} from '../actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Platform application server actions', () => {
  const platformApp: DialPlatformApplicationResource = {
    name: 'my-app',
    path: 'platform/my-app',
    folderId: 'platform/',
    endpoint: 'http://mock',
  } as DialPlatformApplicationResource;

  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
    (assetApi.put as any).mockResolvedValue({ success: true, response: {} });
    (assetApi.delete as any).mockResolvedValue({ success: true });
    (assetApi.list as any).mockResolvedValue([]);
    (assetApi.getMergedWithEtag as any).mockResolvedValue({ success: true, response: platformApp, etag: 'etag-1' });
  });

  test('createPlatformApplication writes to the bare platform-prefixed path, with no version suffix', async () => {
    await createPlatformApplication(platformApp);

    expect(assetApi.put).toHaveBeenCalledOnce();
    const [, type, path] = (assetApi.put as any).mock.calls[0];
    expect(type).toBe(ResourceType.APPLICATION);
    expect(path).toBe('platform/my-app');
    expect(path).not.toContain('__');
  });

  test('updatePlatformApplication writes to the bare platform-prefixed path, with no version suffix', async () => {
    await updatePlatformApplication(platformApp, 'etag-1');

    expect(assetApi.put).toHaveBeenCalledOnce();
    const [, type, path, , options] = (assetApi.put as any).mock.calls[0];
    expect(type).toBe(ResourceType.APPLICATION);
    expect(path).toBe('platform/my-app');
    expect(path).not.toContain('__');
    expect(options).toEqual({ etag: 'etag-1' });
  });

  // ConfigResourceController (the platform bucket's write path) deserializes strictly
  // (FAIL_ON_UNKNOWN_PROPERTIES) — read-only/derived fields the merge reader adds must not round-trip
  // back onto a write, or Core rejects the whole body ("Failed to parse entity").
  test('createPlatformApplication strips read-only/derived fields before writing', async () => {
    const appWithExtras = {
      ...platformApp,
      status: 'valid',
      validationWarnings: [{ field: 'endpoint' }],
      author: 'Yauheni Osipau',
      createdAt: '1',
      updatedAt: '2',
      reference: 'b827783e-d894-467f-b790-d2e900cc8365',
    } as DialPlatformApplicationResource;

    await createPlatformApplication(appWithExtras);

    const [, , , body] = (assetApi.put as any).mock.calls[0];
    expect(body).not.toHaveProperty('status');
    expect(body).not.toHaveProperty('validationWarnings');
    expect(body).not.toHaveProperty('author');
    expect(body).not.toHaveProperty('createdAt');
    expect(body).not.toHaveProperty('updatedAt');
    expect(body).not.toHaveProperty('reference');
    expect(body).toMatchObject({ name: 'my-app', endpoint: 'http://mock' });
  });

  test('updatePlatformApplication strips read-only/derived fields before writing', async () => {
    const appWithExtras = {
      ...platformApp,
      status: 'valid',
      validationWarnings: [{ field: 'endpoint' }],
      author: 'Yauheni Osipau',
      createdAt: '1',
      updatedAt: '2',
      reference: 'b827783e-d894-467f-b790-d2e900cc8365',
    } as DialPlatformApplicationResource;

    await updatePlatformApplication(appWithExtras, 'etag-1');

    const [, , , body] = (assetApi.put as any).mock.calls[0];
    expect(body).not.toHaveProperty('status');
    expect(body).not.toHaveProperty('validationWarnings');
    expect(body).not.toHaveProperty('author');
    expect(body).not.toHaveProperty('createdAt');
    expect(body).not.toHaveProperty('updatedAt');
    expect(body).not.toHaveProperty('reference');
    expect(body).toMatchObject({ name: 'my-app', endpoint: 'http://mock' });
  });

  test('getPlatformApplication reads a platform-prefixed path with the caller-supplied etag', async () => {
    await getPlatformApplication('platform/my-app', 'etag-1');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'platform/my-app',
      'etag-1',
    );
  });

  test('getPlatformApplications lists a platform-prefixed path', async () => {
    await getPlatformApplications('platform/');

    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'platform/');
  });

  test('removePlatformApplication sends If-Match when a concrete etag is supplied', async () => {
    await removePlatformApplication('platform/my-app', 'etag-1');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'platform/my-app', 'etag-1');
  });

  test('removePlatformApplication sends no conditional header when the etag is omitted', async () => {
    await removePlatformApplication('platform/my-app');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'platform/my-app', undefined);
  });

  test('bulkDeletePlatformApplications deletes every path unconditionally', async () => {
    const paths = [{ path: 'platform/app-1' }, { path: 'platform/app-2' }];

    await bulkDeletePlatformApplications(paths);

    expect(assetApi.delete).toHaveBeenCalledTimes(2);
    paths.forEach(({ path }) => {
      expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, path);
    });
  });
});
