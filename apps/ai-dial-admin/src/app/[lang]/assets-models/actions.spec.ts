import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi } from '@/src/app/api/api';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { bulkDeleteModels, createModel, getModel, getModels, removeModel, updateModel } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets model :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getModels action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getModels('platform/');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.MODEL, 'platform/');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getModel action', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getModel('platform/model-name', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.MODEL,
      'platform/model-name',
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createModel action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createModel({
      name: 'model-name',
      path: 'platform/model-name',
      folderId: 'platform/',
      status: DialModelResourceStatus.Valid,
    });
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.MODEL, 'model-name', {
      name: 'model-name',
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('createModel propagates a Core conflict (already exists) failure unchanged', async () => {
    const conflict = {
      success: false,
      errorHeader: 'Precondition Failed',
      errorMessage: 'Already exists',
      status: 412,
    };
    (assetApi.put as any).mockResolvedValue(conflict);

    const result = await createModel({
      name: 'model-name',
      path: 'platform/model-name',
      folderId: 'platform/',
      status: DialModelResourceStatus.Valid,
    });

    expect(result).toBe(conflict);
  });

  test('createModel propagates a Core cross-reference validation failure (422) unchanged', async () => {
    const validationFailure = {
      success: false,
      errorHeader: 'Validation Failed',
      errorMessage: 'tokenizerModel: unknown reference',
      status: 422,
    };
    (assetApi.put as any).mockResolvedValue(validationFailure);

    const result = await createModel({
      name: 'model-name',
      path: 'platform/model-name',
      folderId: 'platform/',
      status: DialModelResourceStatus.Valid,
    });

    expect(result).toBe(validationFailure);
  });

  test('Should call updateModel action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateModel(
      {
        name: 'model-name',
        path: 'platform/model-name',
        folderId: 'platform/',
        status: DialModelResourceStatus.Valid,
      },
      'etag',
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.MODEL,
      'model-name',
      { name: 'model-name' },
      { etag: 'etag' },
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('updateModel propagates an etag-mismatch (412) failure unchanged', async () => {
    const etagMismatch = {
      success: false,
      errorHeader: 'Precondition Failed',
      errorMessage: 'stale etag',
      status: 412,
    };
    (assetApi.put as any).mockResolvedValue(etagMismatch);

    const result = await updateModel(
      {
        name: 'model-name',
        path: 'platform/model-name',
        folderId: 'platform/',
        status: DialModelResourceStatus.Valid,
      },
      'stale-etag',
    );

    expect(result).toBe(etagMismatch);
  });

  test('Should call removeModel action', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeModel('platform/model-name', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.MODEL, 'platform/model-name', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('removeModel without an etag calls the Core client unconditionally', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    await removeModel('platform/model-name');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.MODEL, 'platform/model-name', undefined);
  });

  test('Should call bulkDeleteModels action', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteModels([{ path: 'platform/model-name' }]);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.MODEL, 'platform/model-name');
    expect(result).toEqual({ success: true });
  });

  test('bulkDeleteModels stops at the first failure (fail-fast)', async () => {
    const failure = { success: false, errorHeader: 'Error', errorMessage: 'boom' };
    (assetApi.delete as any).mockResolvedValueOnce(failure).mockResolvedValueOnce({ success: true });

    const result = await bulkDeleteModels([{ path: 'a' }, { path: 'b' }]);

    expect(assetApi.delete).toHaveBeenCalledTimes(1);
    expect(result).toBe(failure);
  });
});

/**
 * Core preserves an omitted upstream secret but re-encrypts a literal `''`, replacing a live credential
 * with an empty one on a save that reports success. These assert the exact absence of the property in
 * the outgoing payload rather than comparing against the strip helper's own output.
 */
describe('Assets model :: upstream secrets are never written as empty strings', () => {
  const payloadOf = (call: unknown[]) => call[3] as { upstreams?: Record<string, unknown>[] };

  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);
  });

  test('Should omit an empty key on update', async () => {
    await updateModel({ name: 'm', upstreams: [{ endpoint: 'http://a', key: '' }] } as any, 'etag');

    expect(payloadOf((assetApi.put as any).mock.calls[0]).upstreams?.[0]).not.toHaveProperty('key');
  });

  test('Should omit an empty key on create', async () => {
    await createModel({ name: 'm', upstreams: [{ endpoint: 'http://a', key: '' }] } as any);

    expect(payloadOf((assetApi.put as any).mock.calls[0]).upstreams?.[0]).not.toHaveProperty('key');
  });

  test('Should send a supplied key', async () => {
    await updateModel({ name: 'm', upstreams: [{ endpoint: 'http://a', key: 'secret' }] } as any, 'etag');

    expect(payloadOf((assetApi.put as any).mock.calls[0]).upstreams?.[0]).toHaveProperty('key', 'secret');
  });

  test('Should omit an empty secretExtraData', async () => {
    await updateModel({ name: 'm', upstreams: [{ endpoint: 'http://a', secretExtraData: '' }] } as any, 'etag');

    expect(payloadOf((assetApi.put as any).mock.calls[0]).upstreams?.[0]).not.toHaveProperty('secretExtraData');
  });

  test('Should strip the read-only status and validationWarnings Core rejects on write', async () => {
    await updateModel(
      {
        name: 'm',
        status: DialModelResourceStatus.Invalid,
        validationWarnings: [{ field: 'interceptors[0]', message: 'not found' }],
      } as any,
      'etag',
    );

    const payload = payloadOf((assetApi.put as any).mock.calls[0]);

    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('validationWarnings');
  });
});
