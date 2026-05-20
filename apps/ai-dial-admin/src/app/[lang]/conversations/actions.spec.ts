import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetsApi, utilityApi } from '@/src/app/api/api';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { getAllDeployments, getConversations } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets conversations :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getConversations action', async () => {
    (assetsApi.getAssetList as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getConversations('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.getAssetList).toHaveBeenCalledWith(TOKEN_MOCK, 'test', ResourceType.CONVERSATION);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getDeployments action', async () => {
    const DEPLOYMENTS_RESPONSE_MOCK = { response: [{ reference: 'model1' }, { reference: 'model2' }] };
    (utilityApi.getAllDeployments as any).mockResolvedValue(DEPLOYMENTS_RESPONSE_MOCK); 

    const result = await getAllDeployments();
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.getAllDeployments).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(DEPLOYMENTS_RESPONSE_MOCK);
  });
});
