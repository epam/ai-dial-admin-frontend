import { DialToolset } from '@/src/models/dial/toolset';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { CORE_TOOLSET_URL, TOOLSETS_URL, TOOLSET_URL, ToolsetsApi } from '../toolsets-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: ToolsetsApi', () => {
  const instance = new ToolsetsApi({ host: TEST_URL });

  const mockToolset: DialToolset = {
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

    const result = await instance.getToolset(mockToolset.name, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLSET_URL(mockToolset.name)}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(mockToolset));
  });

  test('Should calls getCoreToolset by name and return toolSet', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockToolset));

    const result = await instance.getCoreToolset(mockToolset.name, 'etag123', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${CORE_TOOLSET_URL(mockToolset.name)}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(mockToolset));
  });

  test('Should calls createToolset with correct payload', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

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
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

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
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.updateCoreToolset(mockToolset, 'etag123', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${CORE_TOOLSET_URL(mockToolset.name)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockToolset),
      }),
    );
  });

  test('Should calls removeToolset with DELETE method', async () => {
    const mockResponse = { success: true };
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeToolset(TOKEN_MOCK, mockToolset.name);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLSET_URL(mockToolset.name)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
