import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { AppProcessStatus } from '@/src/models/app-process-status';
import { Token } from '@/src/models/auth';
import { CoreSyncStatus } from '@/src/models/core-sync-status';
import { CoreConfigVersion, CoreVersions } from '@/src/models/core-version';
import { ExportRequest } from '@/src/models/export';
import { ServerActionResponse } from '@/src/models/server-action';
import { GlobalSettings } from '@/src/models/system-properties';
import { getFileName } from '@/src/utils/api/get-file-name';
import { API } from './api';
import { BaseApi } from './base-api';

export const SYSTEM_PROPERTIES_URL = `${API}/global-settings`;
export const ADMIN_SETTINGS_URL = `${API}/admin-settings`;
export const VERSION_URL = `${API}/version`;
export const CORE_VERSION_URL = `${VERSION_URL}/core`;
export const CORE_CONFIG_VERSION_URL = `${ADMIN_SETTINGS_URL}/core-config-version`;
const CONFIG_URL = `${API}/configs`;
export const IMPORT_CONFIG_URL = `${CONFIG_URL}/import`;
export const PREVIEW_IMPORT_CONFIG_URL = `${IMPORT_CONFIG_URL}/preview`;
export const IMPORT_ZIP_CONFIG_URL = `${IMPORT_CONFIG_URL}/zip`;
export const PREVIEW_IMPORT_ZIP_CONFIG_URL = `${IMPORT_ZIP_CONFIG_URL}/preview`;
export const EXPORT_CONFIG_URL = `${CONFIG_URL}/export`;
export const EXPORT_CONFIG_MAP_URL = `${EXPORT_CONFIG_URL}/raw/core`;
export const EXPORT_PREVIEW_CONFIG_URL = `${EXPORT_CONFIG_URL}/preview`;
export const RELOAD_CONFIG_URL = `${CONFIG_URL}/sync/status`;
export const DEPLOYMENT_URL = (name: string) => `${API}/deployments/${name}`;
export const SECURITY_INFO_URL = `${API}/security-info`;

export class UtilityApi extends BaseApi {
  getBeVersion(token: Token): Promise<string | null> {
    return this.get(VERSION_URL, token, { Accept: 'text/plain' }).catch(() => null) as Promise<string | null>;
  }

  importJsonConfigs(url: string, token: Token, file: FormData): Promise<ServerActionResponse> {
    return this.postFiles(url, file, token);
  }

  importZipConfig(url: string, token: Token, file: FormData): Promise<ServerActionResponse> {
    return this.postFiles(url, file, token);
  }

  exportConfig(exportConfig: ExportRequest, token: Token): Promise<{ blob: Blob; fileName: string }> {
    return this.sendRequest(EXPORT_CONFIG_URL, 'POST', exportConfig, token).then(async (res) => {
      return { blob: await (res as Response)?.blob?.(), fileName: getFileName(res as Response) || '' };
    });
  }

  exportConfigMap(token: Token): Promise<{ blob: Blob; fileName: string }> {
    return this.sendRequest(EXPORT_CONFIG_MAP_URL, 'POST', { addSecrets: true }, token).then(async (res) => {
      return { blob: await (res as Response)?.blob?.(), fileName: getFileName(res as Response) || '' };
    });
  }

  previewExportConfig(exportConfig: ExportRequest, token: Token): Promise<ServerActionResponse> {
    return this.postAction(EXPORT_PREVIEW_CONFIG_URL, exportConfig, token);
  }

  checkDeploymentByName(name: string, token: Token) {
    return this.head(DEPLOYMENT_URL(name), token);
  }

  getAppProcessStatus(token: Token): Promise<ServerActionResponse<AppProcessStatus>> {
    return this.getAction(RELOAD_CONFIG_URL, token);
  }

  getCoreVersion(token: Token): Promise<ServerActionResponse<CoreVersions>> {
    return this.getAction(CORE_VERSION_URL, token);
  }

  setCoreVersion(version: CoreConfigVersion, token: Token): Promise<ServerActionResponse<AppProcessStatus>> {
    return this.putActionWithEtag(CORE_CONFIG_VERSION_URL, version, token, DEFAULT_ETAG);
  }

  getSystemProperties(token: Token, etag: string): Promise<ServerActionResponse<GlobalSettings>> {
    return this.getActionWithEtag(SYSTEM_PROPERTIES_URL, etag, token);
  }

  updateSystemProperties(properties: GlobalSettings, token: Token, etag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(SYSTEM_PROPERTIES_URL, properties, token, etag);
  }

  getEntitySyncStatus(url: string, token: Token, etag: string): Promise<ServerActionResponse<CoreSyncStatus>> {
    return this.getActionWithMatchEtag(`${API}${url}`, etag, token);
  }

  getSecurityInfo(token: Token): Promise<ServerActionResponse> {
    return this.getAction(SECURITY_INFO_URL, token);
  }
}
