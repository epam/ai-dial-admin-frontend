import { ExportRequest } from '@/src/models/export';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { UtilityApi } from '../utility-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: UtilityApi', () => {
  const instance = new UtilityApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('should fetch backend version', async () => {
    fetch.mockResponseOnce('1.2.3');

    const version = await instance.getBeVersion(TOKEN_MOCK);
    expect(version).toBe('1.2.3');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/version'), expect.anything());
  });

  test('should import json config', async () => {
    const formData = new FormData();
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    const res = await instance.importJsonConfigs('/fake-url', TOKEN_MOCK, formData);
    expect(res).toEqual({ response: JSON.stringify({ success: true }), success: true });
    expect(fetch).toHaveBeenCalled();
  });

  test('should import zip config', async () => {
    const formData = new FormData();
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    const res = await instance.importZipConfig('/fake-url', TOKEN_MOCK, formData);
    expect(res).toEqual({ response: JSON.stringify({ success: true }), success: true });
    expect(fetch).toHaveBeenCalled();
  });

  test('should preview export config', async () => {
    const exportRequest: ExportRequest = { configIds: ['id1'] };
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    const res = await instance.previewExportConfig(exportRequest, TOKEN_MOCK);
    expect(res).toEqual({ response: JSON.stringify({ success: true }), success: true });
  });

  test('should check deployment by name', async () => {
    fetch.mockResponseOnce('', { status: 200 });

    await instance.checkDeploymentByName('my-app', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/deployments/my-app'), expect.anything());
  });

  test('should get app process status', async () => {
    fetch.mockResponseOnce(JSON.stringify({ running: true }));

    const result = await instance.getAppProcessStatus(TOKEN_MOCK);
    expect(result.response).toEqual(JSON.stringify({ running: true }));
  });

  test('should get system properties', async () => {
    fetch.mockResponseOnce(JSON.stringify({ globalInterceptors: ['global'] }));

    const result = await instance.getSystemProperties(TOKEN_MOCK, 'etag');
    expect(result.response).toEqual(JSON.stringify({ globalInterceptors: ['global'] }));
  });

  test('should update system properties', async () => {
    fetch.mockResponseOnce(JSON.stringify({ globalInterceptors: ['global'] }));

    const result = await instance.updateSystemProperties({ globalInterceptors: ['global'] }, TOKEN_MOCK, 'etag');
    expect(result.response).toEqual(JSON.stringify({ globalInterceptors: ['global'] }));
  });

  test('should get core versions', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        defaultVersion: '0.36.6',
        autoDetectedVersion: '0.33.55',
        manuallySetVersion: '0.23.6',
      }),
    );

    const result = await instance.getCoreVersion(TOKEN_MOCK);
    expect(result.response).toEqual(
      JSON.stringify({
        defaultVersion: '0.36.6',
        autoDetectedVersion: '0.33.55',
        manuallySetVersion: '0.23.6',
      }),
    );
  });

  test('should set core versions', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        coreConfigVersion: '0.36.6',
      }),
    );

    const result = await instance.setCoreVersion(
      {
        coreConfigVersion: '0.36.6',
      },
      TOKEN_MOCK,
    );
    expect(result.response).toEqual(
      JSON.stringify({
        coreConfigVersion: '0.36.6',
      }),
    );
  });

  test('should get core sync status', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        currentState: {},
        configState: {},
        status: '',
      }),
    );

    const result = await instance.getEntitySyncStatus('', TOKEN_MOCK, 'etag');
    expect(result.response).toEqual(
      JSON.stringify({
        currentState: {},
        configState: {},
        status: '',
      }),
    );
  });

  test('should get core security info', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));

    const result = await instance.getUserInfo(TOKEN_MOCK);
    expect(result.response).toEqual(JSON.stringify({}));
  });
});
