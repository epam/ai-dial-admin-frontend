import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi } from '@/src/app/api/api';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeleteTranslators,
  createTranslator,
  getTranslator,
  getTranslators,
  removeTranslator,
  updateTranslator,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets translator :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getTranslators action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getTranslators('platform/');

    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.TRANSLATOR, 'platform/');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getTranslator action', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getTranslator('platform/to-responses', 'etag');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.TRANSLATOR,
      'platform/to-responses',
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createTranslator action, stripping read-only projections', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createTranslator({
      name: 'to-responses',
      path: 'platform/to-responses',
      folderId: 'platform/',
      status: DialModelResourceStatus.Valid,
      in: DeploymentInterfaceType.AnthropicMessages,
      out: DeploymentInterfaceType.OpenAIResponses,
      baseUrl: 'http://dial-bedrock-translator/to-responses',
    });

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.TRANSLATOR, 'to-responses', {
      in: DeploymentInterfaceType.AnthropicMessages,
      out: DeploymentInterfaceType.OpenAIResponses,
      baseUrl: 'http://dial-bedrock-translator/to-responses',
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('createTranslator propagates a Core rejection unchanged', async () => {
    const rejection = { success: false, errorHeader: 'Unprocessable Entity', errorMessage: 'out is required' };
    (assetApi.put as any).mockResolvedValue(rejection);

    const result = await createTranslator({
      name: 'to-responses',
      path: 'platform/to-responses',
      folderId: 'platform/',
    });

    expect(result).toBe(rejection);
  });

  test('Should call updateTranslator action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateTranslator(
      { name: 'to-responses', path: 'platform/to-responses', folderId: 'platform/' },
      'etag',
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.TRANSLATOR,
      'to-responses',
      {},
      { etag: 'etag' },
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeTranslator action', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeTranslator('platform/to-responses', 'etag');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.TRANSLATOR, 'platform/to-responses', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call bulkDeleteTranslators action', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteTranslators([{ path: 'platform/to-responses' }]);

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.TRANSLATOR, 'platform/to-responses');
    expect(result).toEqual({ success: true });
  });
});
