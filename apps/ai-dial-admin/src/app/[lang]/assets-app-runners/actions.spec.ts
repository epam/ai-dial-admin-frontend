import { beforeEach, describe, expect, test, vi } from 'vitest';

import { appRunnerSchemaApi, assetApi } from '@/src/app/api/api';
import { DialAppRunnerResource, DialModelResourceStatus } from '@/src/models/dial/resource';
import { RoutePermission } from '@/src/models/dial/route';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeleteRunners,
  createRunner,
  getResolvedRunnerSchema,
  getRunner,
  getRunners,
  removeRunner,
  updateRunner,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

const ID = 'https://mydial.epam.com/custom_application_schemas/qq';
const ENCODED = 'https%3A%2F%2Fmydial.epam.com%2Fcustom_application_schemas%2Fqq';

const runner = { $id: ID, 'dial:applicationTypeDisplayName': 'QQ' } as DialAppRunnerResource;

describe('Assets app runner :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getRunners action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRunners('platform/');

    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APP_TYPE_SCHEMA, 'platform/');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getRunner action', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRunner(ENCODED, 'etag');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APP_TYPE_SCHEMA, ENCODED, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should encode the $id once as the Core resource name on create', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createRunner(runner);

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APP_TYPE_SCHEMA, ENCODED, expect.anything());
  });

  test('Should create without an etag so Core rejects an existing runner', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createRunner(runner);

    expect((assetApi.put as any).mock.calls[0]).toHaveLength(4);
  });

  test('Should pass the caller etag on update', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updateRunner(runner, 'etag123');

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APP_TYPE_SCHEMA, ENCODED, expect.anything(), {
      etag: 'etag123',
    });
  });

  test.each(['!', '~', '*', "'", '(', ')'])('Should reject an id containing %s before calling Core', async (char) => {
    const result = await createRunner({ ...runner, $id: `${ID}${char}` } as DialAppRunnerResource);

    expect(assetApi.put).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.errorHeader).toEqual('Invalid application runner id');
  });

  test('Should reject an invalid id on update too', async () => {
    const result = await updateRunner({ ...runner, $id: `${ID}*` } as DialAppRunnerResource, 'etag');

    expect(assetApi.put).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  describe('payload construction', () => {
    beforeEach(() => {
      (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);
    });

    test('Should strip Core-injected and client-side identity fields', async () => {
      await updateRunner(
        {
          ...runner,
          name: 'schemas/platform/qq',
          status: DialModelResourceStatus.Valid,
          path: 'platform/qq',
          folderId: 'platform/',
          author: 'someone',
          createdAt: '1',
          updatedAt: '2',
        } as DialAppRunnerResource,
        'etag',
      );

      const payload = (assetApi.put as any).mock.calls[0][3];
      expect(payload).not.toHaveProperty('name');
      expect(payload).not.toHaveProperty('status');
      expect(payload).not.toHaveProperty('path');
      expect(payload).not.toHaveProperty('folderId');
      expect(payload).not.toHaveProperty('author');
      expect(payload).not.toHaveProperty('createdAt');
      expect(payload).not.toHaveProperty('updatedAt');
    });

    test('Should keep the schema fields the runner owns', async () => {
      await updateRunner({ ...runner, topics: ['a'] } as DialAppRunnerResource, 'etag');

      const payload = (assetApi.put as any).mock.calls[0][3];
      expect(payload.$id).toEqual(ID);
      expect(payload['dial:applicationTypeDisplayName']).toEqual('QQ');
      expect(payload.topics).toEqual(['a']);
    });

    test('Should convert routes to Core name-keyed objects', async () => {
      await updateRunner(
        {
          ...runner,
          'dial:applicationTypeRoutes': [
            {
              name: 'my_route',
              paths: ['/a'],
              methods: ['GET'],
              upstreams: [{ endpoint: 'http://svc' }],
              permissions: [RoutePermission.READ],
            },
          ],
        } as DialAppRunnerResource,
        'etag',
      );

      const payload = (assetApi.put as any).mock.calls[0][3];
      expect(payload['dial:applicationTypeRoutes']).toEqual({
        my_route: {
          'dial:paths': ['/a'],
          'dial:methods': ['GET'],
          'dial:upstreams': [{ 'dial:endpoint': 'http://svc' }],
          'dial:permissions': ['READ'],
        },
      });
    });

    test('Should omit routes entirely when the runner has none', async () => {
      await updateRunner(runner, 'etag');

      const payload = (assetApi.put as any).mock.calls[0][3];
      expect(payload).not.toHaveProperty('dial:applicationTypeRoutes');
    });
  });

  test('Should call removeRunner with the etag', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeRunner(ENCODED, 'etag');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APP_TYPE_SCHEMA, ENCODED, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeRunner without an etag', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    await removeRunner(ENCODED);

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APP_TYPE_SCHEMA, ENCODED, undefined);
  });

  test('Should call bulkDeleteRunners for each path', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteRunners([{ path: 'a' }, { path: 'b' }]);

    expect(assetApi.delete).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });

  test('Should stop bulk delete at the first failure', async () => {
    (assetApi.delete as any).mockResolvedValueOnce({ success: false, errorHeader: 'Conflict' });

    const result = await bulkDeleteRunners([{ path: 'a' }, { path: 'b' }]);

    expect(assetApi.delete).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
  });

  test('Should read the resolved schema from Core', async () => {
    (appRunnerSchemaApi.resolvedSchema as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getResolvedRunnerSchema(ENCODED);

    expect(appRunnerSchemaApi.resolvedSchema).toHaveBeenCalledWith(TOKEN_MOCK, ENCODED);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should surface a resolved-schema failure to the caller', async () => {
    (appRunnerSchemaApi.resolvedSchema as any).mockResolvedValue({
      success: false,
      errorHeader: 'Not Found',
      errorMessage: 'Schema not found',
    });

    const result = await getResolvedRunnerSchema(ENCODED);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toEqual('Schema not found');
  });
});
