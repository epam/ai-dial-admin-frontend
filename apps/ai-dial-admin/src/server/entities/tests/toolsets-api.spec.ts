import { Toolset, ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import {
  CORE_TOOLSET_URL,
  TOOLSETS_URL,
  TOOLSET_SIGN_IN_URL,
  TOOLSET_SIGN_OUT_URL,
  TOOLSET_URL,
  TOOLS_TRY_OUT_URL,
  TOOLS_URL,
  ToolsetsApi,
} from '../toolsets-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: ToolsetsApi', () => {
  const instance = new ToolsetsApi({ host: TEST_URL });

  const mockToolset: Toolset = {
    name: 'test-toolset',
    description: 'Test ToolSet',
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getToolsetList and return list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockToolset]));

    const result = await instance.getToolsetList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${TOOLSETS_URL}`, expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(JSON.stringify([mockToolset]));
  });

  test('Should calls getToolset by name and return toolSet', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockToolset));

    const result = await instance.getToolset(mockToolset.name as string, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLSET_URL(mockToolset.name)}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(mockToolset));
  });

  test('Should calls getTools ', async () => {
    fetch.mockResponseOnce({ tools: [{ name: 't1' }, { name: 't2' }] });

    const result = await instance.getTools(mockToolset.name as string, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLS_URL(mockToolset.name as string)}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual([]);
  });

  test('Should calls getCoreToolset by name and return toolSet', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockToolset));

    const result = await instance.getCoreToolset(mockToolset.name as string, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${CORE_TOOLSET_URL(mockToolset.name as string)}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(mockToolset));
  });

  test('Should calls createToolset with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.createToolset(mockToolset, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLSETS_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockToolset),
      }),
    );
  });

  test('Should calls updateToolset with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateToolset({ ...mockToolset, name: void 0 }, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLSET_URL()}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ...mockToolset, name: void 0 }),
      }),
    );
  });

  test('Should calls updateToolset with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateToolset(mockToolset, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLSET_URL(mockToolset.name)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockToolset),
      }),
    );
  });

  test('Should calls updateCoreToolset with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateCoreToolset(mockToolset, 'toolset', 'etag123', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${CORE_TOOLSET_URL('toolset')}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockToolset),
      }),
    );
  });

  test('Should calls removeToolset with DELETE method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeToolset(TOKEN_MOCK, mockToolset.name);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLSET_URL(mockToolset.name)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should calls tryOutTool with POST method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.tryOutTool(mockToolset.name as string, {}, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLS_TRY_OUT_URL(mockToolset.name as string)}`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('Should calls signInToolset ', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.signInToolset({ name: 'toolset' }, ToolsetAuthCredentialLevel.GLOBAL, TOKEN_MOCK, 'key', 'code');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLSET_SIGN_IN_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          url: 'toolset',
          credentialsLevel: ToolsetAuthCredentialLevel.GLOBAL,
          apiKey: 'key',
        }),
      }),
    );
  });

  test('Should calls signOutToolset ', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.signOutToolset({ name: 'toolset' }, ToolsetAuthCredentialLevel.GLOBAL, TOKEN_MOCK);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLSET_SIGN_OUT_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ url: 'toolset', credentialsLevel: ToolsetAuthCredentialLevel.GLOBAL }),
      }),
    );
  });
});
