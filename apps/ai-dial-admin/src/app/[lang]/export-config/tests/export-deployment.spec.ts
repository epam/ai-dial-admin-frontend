import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { deploymentConfigApi } from '@/src/app/api/api';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { DeploymentExportComponentType } from '@/src/types/deployments/export';
import { ExportType } from '@/src/types/export';
import { exportDeploymentConfig, previewDeploymentExportConfig } from '../actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('next/headers', () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));
vi.mock('@/src/app/api/api');

describe('Export config actions :: exportDeploymentConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('calls deploymentConfigApi.exportConfig with request and token', async () => {
    const mockResponse = { blob: new Blob(), fileName: 'export.zip' };
    (deploymentConfigApi.exportConfig as any).mockResolvedValue(mockResponse);

    const request = {
      $type: ExportType.Custom,
      addSecrets: true,
      addGlobalImageBuildDomainWhitelist: false,
      components: [{ name: 'container-1', type: DeploymentExportComponentType.MCP_DEPLOYMENT }],
    };

    const result = await exportDeploymentConfig(request);

    expect(getUserToken).toHaveBeenCalled();
    expect(deploymentConfigApi.exportConfig).toHaveBeenCalledWith(request, TOKEN_MOCK);
    expect(result).toBe(mockResponse);
  });

  test('passes addGlobalImageBuildDomainWhitelist flag correctly', async () => {
    const mockResponse = { blob: new Blob(), fileName: 'export.zip' };
    (deploymentConfigApi.exportConfig as any).mockResolvedValue(mockResponse);

    const request = {
      $type: ExportType.Custom,
      addSecrets: false,
      addGlobalImageBuildDomainWhitelist: true,
      components: [{ name: 'img-id', type: DeploymentExportComponentType.ADAPTER_IMAGE_DEFINITION }],
    };

    await exportDeploymentConfig(request);

    expect(deploymentConfigApi.exportConfig).toHaveBeenCalledWith(
      expect.objectContaining({ addGlobalImageBuildDomainWhitelist: true }),
      TOKEN_MOCK,
    );
  });

  test('handles empty components array', async () => {
    const mockResponse = { blob: new Blob(), fileName: 'export.zip' };
    (deploymentConfigApi.exportConfig as any).mockResolvedValue(mockResponse);

    const request = {
      $type: ExportType.Custom,
      addSecrets: false,
      components: [],
    };

    const result = await exportDeploymentConfig(request);

    expect(deploymentConfigApi.exportConfig).toHaveBeenCalledWith(request, TOKEN_MOCK);
    expect(result).toBe(mockResponse);
  });
});

describe('Export config actions :: previewDeploymentExportConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('calls deploymentConfigApi.previewExportConfig with request and token', async () => {
    const mockResponse = { success: true, response: { deployments: [], imageDefinitions: [] } };
    (deploymentConfigApi.previewExportConfig as any).mockResolvedValue(mockResponse);

    const request = {
      $type: ExportType.Custom,
      addSecrets: false,
      addGlobalImageBuildDomainWhitelist: false,
      components: [{ name: 'mcp-1', type: DeploymentExportComponentType.MCP_DEPLOYMENT }],
    };

    const result = await previewDeploymentExportConfig(request);

    expect(getUserToken).toHaveBeenCalled();
    expect(deploymentConfigApi.previewExportConfig).toHaveBeenCalledWith(request, TOKEN_MOCK);
    expect(result).toBe(mockResponse);
  });
});
