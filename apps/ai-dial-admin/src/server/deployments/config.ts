import { Token } from '@/src/models/auth';
import { DeploymentExportRequest } from '@/src/models/export';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { getFileName } from '@/src/utils/api/get-file-name';

const DEPLOYMENT_CONFIGS_URL = `${API}/configs`;
export const DEPLOYMENT_EXPORT_CONFIG_URL = `${DEPLOYMENT_CONFIGS_URL}/export`;
export const DEPLOYMENT_EXPORT_PREVIEW_URL = `${DEPLOYMENT_EXPORT_CONFIG_URL}/preview`;
export const DEPLOYMENT_IMPORT_CONFIG_URL = `${DEPLOYMENT_CONFIGS_URL}/import`;
export const DEPLOYMENT_IMPORT_PREVIEW_URL = `${DEPLOYMENT_IMPORT_CONFIG_URL}/preview`;

export class DeploymentConfigApi extends BaseApi {
  async exportConfig(exportConfig: DeploymentExportRequest, token: Token): Promise<{ blob: Blob; fileName: string }> {
    const res = await this.sendRequest(DEPLOYMENT_EXPORT_CONFIG_URL, 'POST', exportConfig, token);
    return { blob: await (res as Response)?.blob?.(), fileName: getFileName(res as Response) || '' };
  }

  previewExportConfig(exportConfig: DeploymentExportRequest, token: Token): Promise<ServerActionResponse> {
    return this.postAction(DEPLOYMENT_EXPORT_PREVIEW_URL, exportConfig, token);
  }

  previewImportConfig(file: FormData, resolutionPolicy: string, token: Token): Promise<ServerActionResponse> {
    return this.postFiles(`${DEPLOYMENT_IMPORT_PREVIEW_URL}?resolutionPolicy=${resolutionPolicy}`, file, token);
  }

  importConfig(file: FormData, resolutionPolicy: string, token: Token): Promise<ServerActionResponse> {
    return this.postFiles(`${DEPLOYMENT_IMPORT_CONFIG_URL}?resolutionPolicy=${resolutionPolicy}`, file, token);
  }
}
