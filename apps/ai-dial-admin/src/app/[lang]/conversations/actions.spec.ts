import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, utilityApi } from '@/src/app/api/api';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  deleteConversation,
  deleteConversations,
  getAllDeployments,
  getConversation,
  getConversations,
} from './actions';

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
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getConversations('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.CONVERSATION, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('getConversations with an empty path still resolves the top-level (public/-defaulted) list', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getConversations('');

    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.CONVERSATION, '');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getConversation action', async () => {
    const MERGED_RESPONSE = { success: true, response: { name: 'c' }, etag: 'etag-1' };
    (assetApi.getMergedWithEtag as any).mockResolvedValue(MERGED_RESPONSE);

    const result = await getConversation('folder/c', 'etag-0');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.CONVERSATION,
      'folder/c',
      'etag-0',
    );
    expect(result).toBe(MERGED_RESPONSE);
  });

  test('Should call getDeployments action', async () => {
    const DEPLOYMENTS_RESPONSE_MOCK = { response: [{ reference: 'model1' }, { reference: 'model2' }] };
    (utilityApi.getAllDeployments as any).mockResolvedValue(DEPLOYMENTS_RESPONSE_MOCK);

    const result = await getAllDeployments();
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.getAllDeployments).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(result).toBe(DEPLOYMENTS_RESPONSE_MOCK);
  });

  test('deleteConversation sends the supplied etag through to the Core client', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    await deleteConversation('folder/c', 'etag-1');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.CONVERSATION, 'folder/c', 'etag-1');
  });

  test('deleteConversation without an etag calls the Core client unconditionally', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    await deleteConversation('folder/c');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.CONVERSATION, 'folder/c', undefined);
  });

  test('deleteConversations deletes each path and succeeds when all succeed', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await deleteConversations([{ path: 'a' }, { path: 'b' }]);

    expect(assetApi.delete).toHaveBeenCalledTimes(2);
    expect(assetApi.delete).toHaveBeenNthCalledWith(1, TOKEN_MOCK, ResourceType.CONVERSATION, 'a');
    expect(assetApi.delete).toHaveBeenNthCalledWith(2, TOKEN_MOCK, ResourceType.CONVERSATION, 'b');
    expect(result).toEqual({ success: true });
  });

  test('deleteConversations stops and returns the first failure (fail-fast, matching prior BE behavior)', async () => {
    const failure = { success: false, errorHeader: 'Error', errorMessage: 'boom' };
    (assetApi.delete as any).mockResolvedValueOnce(failure).mockResolvedValueOnce({ success: true });

    const result = await deleteConversations([{ path: 'a' }, { path: 'b' }]);

    expect(assetApi.delete).toHaveBeenCalledTimes(1);
    expect(result).toBe(failure);
  });
});
