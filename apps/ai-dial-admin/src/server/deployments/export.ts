import { Token } from '@/src/models/auth';
import { DeploymentExportRequest } from '@/src/models/export';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { getFileName } from '@/src/utils/api/get-file-name';

export const DEPLOYMENT_EXPORT_CONFIG_URL = `${API}/configs/export`;

export class DeploymentExportApi extends BaseApi {
  exportConfig(exportConfig: DeploymentExportRequest, token: Token): Promise<{ blob: Blob; fileName: string }> {
    return this.sendRequest(DEPLOYMENT_EXPORT_CONFIG_URL, 'POST', exportConfig, token).then(async (res) => {
      return { blob: await (res as Response)?.blob?.(), fileName: getFileName(res as Response) || '' };
    });
  }
}
