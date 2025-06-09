import { JWT } from 'next-auth/jwt';

import { ExportRequest } from '@/src/models/export';
import { ServerActionResponse } from '@/src/models/server-action';
import { getFileName } from '@/src/utils/api/get-file-name';
import { API } from './api';
import { BaseApi } from './base-api';
import { AppProcessStatus } from '@/src/models/app-process-status';

export const VERSION_URL = `${API}/version`;
const CONFIG_URL = `${API}/configs`;
export const RELOAD_CONFIG_URL = `${CONFIG_URL}/reload`;
export const IMPORT_CONFIG_URL = `${CONFIG_URL}/import`;
export const IMPORT_ZIP_CONFIG_URL = `${IMPORT_CONFIG_URL}/zip`;
export const EXPORT_CONFIG_URL = `${CONFIG_URL}/export`;
export const EXPORT_PREVIEW_CONFIG_URL = `${EXPORT_CONFIG_URL}/preview`;
export const DEPLOYMENT_URL = (name: string) => `${API}/deployments/${name}`;

export class UtilityApi extends BaseApi {
  getBeVersion(token: JWT | null): Promise<string | null> {
    return this.get(VERSION_URL, token, { Accept: 'text/plain' }).catch(() => null) as Promise<string | null>;
  }

  reloadConfig(token: JWT | null): Promise<ServerActionResponse> {
    return this.getAction(RELOAD_CONFIG_URL, token);
  }

  importConfig(token: JWT | null, file: FormData): Promise<ServerActionResponse> {
    return this.postFiles(IMPORT_CONFIG_URL, file, token);
  }

  importZipConfig(token: JWT | null, file: FormData): Promise<ServerActionResponse> {
    return this.postFiles(IMPORT_ZIP_CONFIG_URL, file, token);
  }

  exportConfig(exportConfig: ExportRequest, token: JWT | null): Promise<{ blob: Blob; fileName: string }> {
    return this.sendRequest(EXPORT_CONFIG_URL, 'POST', exportConfig, token).then(async (res) => {
      return { blob: await (res as Response)?.blob?.(), fileName: getFileName(res as Response) || '' };
    });
  }

  previewExportConfig(exportConfig: ExportRequest, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(EXPORT_PREVIEW_CONFIG_URL, exportConfig, token);
  }

  checkDeploymentByName(name: string, token: JWT | null) {
    return this.head(DEPLOYMENT_URL(name), token);
  }

  getAppProcessStatus(token: JWT | null): Promise<AppProcessStatus | null> {
    return this.get(`${EXPORT_CONFIG_URL}/status`, token);
  }
}
