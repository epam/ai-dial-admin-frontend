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

  test('should reload config', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    const res = await instance.reloadConfig(TOKEN_MOCK);
    expect(res).toEqual({ response: JSON.stringify({ success: true }), success: true });
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
    expect(result).toEqual(JSON.stringify({ running: true }));
  });
});
