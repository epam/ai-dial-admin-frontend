import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { DialApplication } from '@/src/models/dial/application';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  APPLICATIONS_URL,
  APPLICATION_URL,
  ApplicationsApi,
  CORE_APPLICATION_URL,
  TOOLS_TRY_OUT_URL,
  TOOLS_URL,
} from '../applications-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: ApplicationsApi', () => {
  const instance = new ApplicationsApi({ host: TEST_URL });

  const mockApp: DialApplication = {
    name: 'test-app',
    description: 'Test Application',
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getApplicationsList and return list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockApp]));

    const result = await instance.getApplicationsList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${APPLICATIONS_URL}`, expect.objectContaining({ method: 'GET' }));
    expect(result).toEqual(JSON.stringify([mockApp]));
  });

  test('Should calls getApplicationsListAction and return list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockApp]));

    const result = await instance.getApplicationsListAction(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(`${TEST_URL}${APPLICATIONS_URL}`, expect.objectContaining({ method: 'GET' }));
    expect(result.response).toEqual(JSON.stringify([mockApp]));
  });

  test('Should calls getApplication by name and return application', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockApp));

    const result = await instance.getApplication(mockApp.name || '', TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_URL(mockApp.name)}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(mockApp));
  });

  test('Should calls getCoreApplication by name and return application', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockApp));

    const result = await instance.getCoreApplication(mockApp.name || '', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${CORE_APPLICATION_URL(mockApp.name || '')}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.response).toEqual(JSON.stringify(mockApp));
  });

  test('Should calls createApplication with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.createApplication(mockApp, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATIONS_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockApp),
      }),
    );
  });

  test('Should calls updateApplication with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateApplication(mockApp, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_URL(mockApp.name)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockApp),
      }),
    );
  });

  test('Should calls updateApplication with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateApplication({ ...mockApp, name: void 0 }, TOKEN_MOCK, 'etag123');

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_URL()}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ...mockApp, name: void 0 }),
      }),
    );
  });

  test('Should calls updateCoreApplication with correct payload', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateCoreApplication(mockApp, 'app', 'etag123', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${CORE_APPLICATION_URL('app')}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockApp),
      }),
    );
  });

  test('Should calls removeApplication with DELETE method', async () => {
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeApplication(TOKEN_MOCK, mockApp.name);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${APPLICATION_URL(mockApp.name)}`,
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });

  test('Should calls getTools with correct url', async () => {
    const mockTools = { tools: [{ name: 'tool1' }, { name: 'tool2' }] };
    fetch.mockResponseOnce(JSON.stringify(mockTools));

    await instance.getTools(mockApp.name || '', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLS_URL(mockApp.name || '')}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls getTools and return ServerActionResponse', async () => {
    const mockTools = { tools: [{ name: 'tool1' }] };
    fetch.mockResponseOnce(JSON.stringify(mockTools));

    const result = await instance.getTools(mockApp.name || '', TOKEN_MOCK);

    expect(result.response).toEqual(JSON.stringify(mockTools));
  });

  test('Should calls tryOutTool with correct payload', async () => {
    const mockBody = { toolName: 'tool1', input: { key: 'value' } };
    fetch.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    const result = await instance.tryOutTool(mockApp.name || '', mockBody, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${TOOLS_TRY_OUT_URL(mockApp.name || '')}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockBody),
      }),
    );
    expect(result.response).toEqual(JSON.stringify(RESPONSE_MOCK));
  });
});
