import { beforeEach, describe, expect, test, vi } from 'vitest';

import { toolSetsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createToolset,
  getCoreToolset,
  getTools,
  removeToolset,
  signInToolset,
  signOutToolset,
  tryOutTool,
  updateCoreToolset,
  updateToolset,
} from './actions';
import { ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Toolsets :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getTools action', async () => {
    (toolSetsApi.getTools as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getTools('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(toolSetsApi.getTools).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getCoreToolset action', async () => {
    (toolSetsApi.getCoreToolset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getCoreToolset('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(toolSetsApi.getCoreToolset).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeToolset action', async () => {
    (toolSetsApi.removeToolset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeToolset('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(toolSetsApi.removeToolset).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createToolset action', async () => {
    (toolSetsApi.createToolset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createToolset({ name: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(toolSetsApi.createToolset).toHaveBeenCalledWith(
      {
        name: 'test',
        allowedTools: undefined,
        transport: 'sse',
      },
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateToolset action', async () => {
    (toolSetsApi.updateToolset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateToolset({ name: 'test' }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(toolSetsApi.updateToolset).toHaveBeenCalledWith({ name: 'test' }, TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateCoreToolset action', async () => {
    (toolSetsApi.updateCoreToolset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateCoreToolset({ name: 'test' }, 'test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(toolSetsApi.updateCoreToolset).toHaveBeenCalledWith({ name: 'test' }, 'test', 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call tryOutTool action', async () => {
    (toolSetsApi.tryOutTool as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await tryOutTool('testSet', { name: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(toolSetsApi.tryOutTool).toHaveBeenCalledWith('testSet', { name: 'test' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call signInToolset action', async () => {
    (toolSetsApi.signInToolset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await signInToolset(
      { name: 'name' },
      ToolsetAuthCredentialLevel.GLOBAL,
      'https://redirect.example.com/callback',
      'key',
      'code',
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(toolSetsApi.signInToolset).toHaveBeenCalledWith(
      { name: 'name' },
      'https://redirect.example.com/callback',
      ToolsetAuthCredentialLevel.GLOBAL,
      TOKEN_MOCK,
      'key',
      'code',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call signOutToolset action', async () => {
    (toolSetsApi.signOutToolset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await signOutToolset({ name: 'name' }, ToolsetAuthCredentialLevel.GLOBAL);
    expect(getUserToken).toHaveBeenCalled();
    expect(toolSetsApi.signOutToolset).toHaveBeenCalledWith(
      { name: 'name' },
      ToolsetAuthCredentialLevel.GLOBAL,
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });
});
