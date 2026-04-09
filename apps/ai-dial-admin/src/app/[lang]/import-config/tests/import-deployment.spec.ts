import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { deploymentConfigApi } from '@/src/app/api/api';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { DeploymentImportResolutionPolicy } from '@/src/types/deployments/import';
import { importDeploymentConfig, previewDeploymentImportConfig } from '../actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('next/headers', () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));
vi.mock('@/src/app/api/api');

describe('Import config actions :: importDeploymentConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('calls deploymentConfigApi.importConfig with file, policy and token', async () => {
    const mockResponse = { success: true };
    (deploymentConfigApi.importConfig as any).mockResolvedValue(mockResponse);

    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'config.zip');

    const result = await importDeploymentConfig(formData, DeploymentImportResolutionPolicy.OVERWRITE);

    expect(getUserToken).toHaveBeenCalled();
    expect(deploymentConfigApi.importConfig).toHaveBeenCalledWith(
      formData,
      DeploymentImportResolutionPolicy.OVERWRITE,
      TOKEN_MOCK,
    );
    expect(result).toBe(mockResponse);
  });
});

describe('Import config actions :: previewDeploymentImportConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('calls deploymentConfigApi.previewImportConfig with file, policy and token', async () => {
    const mockResponse = { success: true, response: { mcpDeployments: [] } };
    (deploymentConfigApi.previewImportConfig as any).mockResolvedValue(mockResponse);

    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'config.zip');

    const result = await previewDeploymentImportConfig(formData, DeploymentImportResolutionPolicy.SKIP_IF_EXISTS);

    expect(getUserToken).toHaveBeenCalled();
    expect(deploymentConfigApi.previewImportConfig).toHaveBeenCalledWith(
      formData,
      DeploymentImportResolutionPolicy.SKIP_IF_EXISTS,
      TOKEN_MOCK,
    );
    expect(result).toBe(mockResponse);
  });
});
