import { beforeEach, describe, expect, test, vi } from 'vitest';

import { interceptorTemplatesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK, RESPONSE_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createInterceptorTemplate,
  deleteInterceptorTemplate,
  getInterceptorTemplate,
  getInterceptorTemplatesList,
  updateInterceptorTemplate,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Interceptor templates :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getInterceptorTemplatesList action', async () => {
    (interceptorTemplatesApi.getInterceptorTemplatesList as any).mockResolvedValue(RESPONSE_MOCK);

    await getInterceptorTemplatesList();
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorTemplatesApi.getInterceptorTemplatesListAction).toHaveBeenCalledWith(TOKEN_MOCK);
  });

  test('Should call getInterceptorTemplate action', async () => {
    (interceptorTemplatesApi.getInterceptorTemplate as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getInterceptorTemplate('test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorTemplatesApi.getInterceptorTemplate).toHaveBeenCalledWith('test', TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createInterceptorTemplate action', async () => {
    (interceptorTemplatesApi.createInterceptorTemplate as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createInterceptorTemplate({ name: 'test', description: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorTemplatesApi.createInterceptorTemplate).toHaveBeenCalledWith(
      { name: 'test', description: 'test' },
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateInterceptorTemplate action', async () => {
    (interceptorTemplatesApi.updateInterceptorTemplate as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateInterceptorTemplate({ name: 'test', description: 'test' }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorTemplatesApi.updateInterceptorTemplate).toHaveBeenCalledWith(
      { name: 'test', description: 'test' },
      TOKEN_MOCK,
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call deleteInterceptorTemplate action', async () => {
    (interceptorTemplatesApi.deleteInterceptorTemplate as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await deleteInterceptorTemplate('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(interceptorTemplatesApi.deleteInterceptorTemplate).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });
});
