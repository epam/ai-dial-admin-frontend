import fetch from 'jest-fetch-mock';
import { UtilityApi } from '../utility-api';
import { TOKEN_MOCK, TEST_URL } from '@/src/utils/tests/mock/api.mock';
import {
  VERSION_URL,
  EXPORT_CONFIG_URL,
  IMPORT_CONFIG_URL,
  RELOAD_CONFIG_URL,
  EXPORT_PREVIEW_CONFIG_URL,
} from '../utility-api';

describe('Server :: UtilityApi', () => {
  const instance = new UtilityApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  it('should fetch backend version as plain text', async () => {
    fetch.mockResponseOnce('1.2.3');

    const result = await instance.getBeVersion(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${VERSION_URL}`,
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: 'text/plain' }),
        method: 'GET',
      }),
    );
    expect(result).toBe('1.2.3');
  });

  it('should reload config', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.reloadConfig(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(RELOAD_CONFIG_URL), expect.anything());
  });

  it('should import config via FormData', async () => {
    const formData = new FormData();
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.importConfig(TOKEN_MOCK, formData);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(IMPORT_CONFIG_URL), expect.anything());
  });

  it('should preview export config', async () => {
    fetch.mockResponseOnce(JSON.stringify({ preview: true }));

    await instance.previewExportConfig({ name: 'preview-test' }, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(EXPORT_PREVIEW_CONFIG_URL), expect.anything());
  });

  it('should call HEAD request for deployment check', async () => {
    fetch.mockResponseOnce('', { status: 200 });

    await instance.checkDeploymentByName('test-deployment', TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/deployments/test-deployment'),
      expect.objectContaining({ method: 'HEAD' }),
    );
  });

  it('should get app process status', async () => {
    const mockStatus = { running: true };
    fetch.mockResponseOnce(JSON.stringify(mockStatus));

    const result = await instance.getAppProcessStatus(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`${EXPORT_CONFIG_URL}/status`), expect.anything());
    expect(result).toEqual(JSON.stringify(mockStatus));
  });
});
