import { beforeEach, describe, expect, test, vi } from 'vitest';

import { applicationsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK, RESPONSE_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createApplication,
  getCoreApplication,
  removeApplication,
  updateApplication,
  updateCoreApplication,
  getApplication,
  getApplications,
  getTools,
  tryOutTool,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Applications :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call removeApplication action', async () => {
    (applicationsApi.removeApplication as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeApplication('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationsApi.removeApplication).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getCoreApplication action', async () => {
    (applicationsApi.getCoreApplication as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getCoreApplication('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationsApi.getCoreApplication).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createApplication action', async () => {
    (applicationsApi.createApplication as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createApplication({ name: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationsApi.createApplication).toHaveBeenCalledWith(
      {
        name: 'test',
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

  test('Should call updateApplication action', async () => {
    (applicationsApi.updateApplication as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateApplication({ name: 'test' }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationsApi.updateApplication).toHaveBeenCalledWith(
      { name: 'test', applicationProperties: {}, defaults: {}, responsesDefaults: {}, routes: void 0 },
      TOKEN_MOCK,
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateApplication action', async () => {
    (applicationsApi.updateApplication as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateApplication(
      {
        name: 'test',
        applicationPropertiesTemp: [{ key: 'key', required: true, type: 'str', value: 'value' }],
        defaultsTemp: [{ key: 'key', type: 'str', value: 'value' }],
      },
      'etag',
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationsApi.updateApplication).toHaveBeenCalledWith(
      {
        name: 'test',
        applicationProperties: { key: 'value' },
        defaults: { key: 'value' },
        responsesDefaults: {},
        routes: void 0,
      },
      TOKEN_MOCK,
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateCoreApplication action', async () => {
    (applicationsApi.updateCoreApplication as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateCoreApplication({ name: 'test' }, 'test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationsApi.updateCoreApplication).toHaveBeenCalledWith({ name: 'test' }, 'test', 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getApplication action', async () => {
    (applicationsApi.getApplication as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getApplication('test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationsApi.getApplication).toHaveBeenCalledWith('test', TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getApplications action', async () => {
    (applicationsApi.getApplicationsListAction as any).mockResolvedValue(RESPONSE_MOCK);

    await getApplications();
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationsApi.getApplicationsListAction).toHaveBeenCalledWith(TOKEN_MOCK);
  });

  test('Should call getTools action', async () => {
    (applicationsApi.getTools as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getTools('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationsApi.getTools).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call tryOutTool action', async () => {
    (applicationsApi.tryOutTool as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await tryOutTool('testSet', { name: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationsApi.tryOutTool).toHaveBeenCalledWith('testSet', { name: 'test' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
