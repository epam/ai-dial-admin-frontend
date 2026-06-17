import { beforeEach, describe, expect, test, vi } from 'vitest';

import { adaptersApi, modelsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createModel,
  getCoreModel,
  getModelsListAction,
  getModelsAdapters,
  getModelsTokenizers,
  getModelsTopics,
  removeModel,
  updateCoreModel,
  updateModel,
  getModelsList,
  getModel,
} from './actions';
import { DialModel } from '@/src/models/dial/model';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Models :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getModelsTopics action', async () => {
    (modelsApi.getModelsTopics as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getModelsTopics();
    expect(getUserToken).toHaveBeenCalled();
    expect(modelsApi.getModelsTopics).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getModelsTokenizers action', async () => {
    (modelsApi.getModelsTokenizers as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getModelsTokenizers();
    expect(getUserToken).toHaveBeenCalled();
    expect(modelsApi.getModelsTokenizers).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getModelsAdapters action', async () => {
    (adaptersApi.getAdaptersListAction as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getModelsAdapters();
    expect(getUserToken).toHaveBeenCalled();
    expect(adaptersApi.getAdaptersListAction).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getModelsListAction action', async () => {
    (modelsApi.getModelsListAction as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getModelsListAction();
    expect(getUserToken).toHaveBeenCalled();
    expect(modelsApi.getModelsListAction).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getModels action', async () => {
    (modelsApi.getModelsList as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getModelsList();
    expect(getUserToken).toHaveBeenCalled();
    expect(modelsApi.getModelsList).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getCoreModel action', async () => {
    (modelsApi.getCoreModel as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getCoreModel('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(modelsApi.getCoreModel).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getModel action', async () => {
    (modelsApi.getModel as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getModel('test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(modelsApi.getModel).toHaveBeenCalledWith('test', TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeModel action', async () => {
    (modelsApi.removeModel as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeModel('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(modelsApi.removeModel).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createModel action', async () => {
    (modelsApi.createModel as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createModel({ name: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(modelsApi.createModel).toHaveBeenCalledWith(
      {
        name: 'test',
        source: {
          completionEndpointPath: 'test/chat/completions',
        },
        type: 'chat',
        defaultRoleLimit: {
          day: null,
          minute: null,
          month: null,
          week: null,
        },
      },
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createModel action with old completionEndpointPath', async () => {
    (modelsApi.createModel as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createModel(
      { name: 'test', source: { completionEndpointPath: 'endpoint/path' } } as DialModel,
      true,
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(modelsApi.createModel).toHaveBeenCalledWith(
      {
        name: 'test',
        source: {
          completionEndpointPath: 'endpoint/path',
        },
        type: 'chat',
        defaultRoleLimit: {
          day: null,
          minute: null,
          month: null,
          week: null,
        },
      },
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateModel action', async () => {
    (modelsApi.updateModel as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateModel({ name: 'test' }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(modelsApi.updateModel).toHaveBeenCalledWith(
      { name: 'test', defaults: {}, responsesDefaults: {} },
      TOKEN_MOCK,
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateCoreModel action', async () => {
    (modelsApi.updateCoreModel as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateCoreModel({ name: 'test' }, 'test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(modelsApi.updateCoreModel).toHaveBeenCalledWith({ name: 'test' }, 'test', 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
