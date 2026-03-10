import { describe, test, expect, vi } from 'vitest';
import { DeploymentConfigApi, DEPLOYMENT_IMPORT_CONFIG_URL } from '../config';
import { DeploymentImportResolutionPolicy } from '@/src/types/deployments/import';
import createFetchMock from 'vitest-fetch-mock';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('DeploymentConfigApi - importConfig', () => {
  const instance = new DeploymentConfigApi({ host: TEST_URL });

  test('calls import URL with resolutionPolicy query param and POST method', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.zip');

    await instance.importConfig(formData, DeploymentImportResolutionPolicy.OVERWRITE, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        `${DEPLOYMENT_IMPORT_CONFIG_URL}?resolutionPolicy=${DeploymentImportResolutionPolicy.OVERWRITE}`,
      ),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('calls import URL with SKIP_IF_EXISTS policy', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.zip');

    await instance.importConfig(formData, DeploymentImportResolutionPolicy.SKIP_IF_EXISTS, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        `${DEPLOYMENT_IMPORT_CONFIG_URL}?resolutionPolicy=${DeploymentImportResolutionPolicy.SKIP_IF_EXISTS}`,
      ),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
