import { JWT } from 'next-auth/jwt';

import { DEFAULT_ETAG, IF_MATCH, IF_NONE_MATCH } from '@/src/constants/api-headers';
import { ROOT_FOLDER } from '@/src/constants/file';
import { Asset, AssetApp, AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/resource-type';
import { ImportFileType } from '@/src/types/import';
import { getFileName } from '@/src/utils/api/get-file-name';
import { changePath, getFolderNameAndPath } from '@/src/utils/files/path';
import { API } from '../api';
import { BaseApi } from '../base-api';
import { Tool, ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { getToolsetSignInBody, getToolsetBasicBody } from '@/src/utils/toolset/toolset-auth';

export enum ResourceOperation {
  LIST = 'list',
  GET = 'get',
  CREATE = 'create',
  DELETE = 'delete',
  DELETE_BULK = 'delete/bulk',
  MOVE = 'move',
  EXPORT = 'export',
  EXPORT_JSON = 'export/json',
  IMPORT = 'import',
  IMPORT_ZIP = 'import/zip',
  IMPORT_JSON = 'import/json',
  DOWNLOAD = 'download',
  UPDATE = 'update',
}

export const ResourceBasePaths: Record<ResourceType, string> = {
  [ResourceType.PROMPT]: `${API}/prompts`,
  [ResourceType.FILE]: `${API}/files`,
  [ResourceType.APPLICATION]: `${API}/application-resources`,
  [ResourceType.TOOLSET]: `${API}/toolset-resources`,
  [ResourceType.CONVERSATION]: `${API}/conversations`,
};

export class AssetsApi extends BaseApi {
  buildUrl(resource: ResourceType, operation?: ResourceOperation): string {
    const basePath = ResourceBasePaths[resource];
    return operation ? `${basePath}/${operation}` : basePath;
  }

  async getAssetList(
    token: JWT | null,
    path: string,
    type: ResourceType,
  ): Promise<(Asset | DialFile)[] | null | undefined> {
    const url = this.buildUrl(type, ResourceOperation.LIST);
    if (type === ResourceType.FILE) {
      return this.post(ResourceBasePaths[type], { path }, token).then((response) =>
        response === void 0 ? void 0 : (response as { items: DialFile[] })?.items || [],
      );
    } else {
      const allItems: Asset[] = [];
      let nextToken: string | undefined = undefined;

      while (true) {
        const body: { path: string; nextToken?: string } = { path };
        if (nextToken) {
          body.nextToken = nextToken;
        }

        const response = (await this.post(url, body, token)) as { items: Asset[]; nextToken?: string } | undefined;

        if (!response) break;

        if (Array.isArray(response.items) && response.items.length > 0) {
          allItems.push(...response.items);
        }

        if (!response.nextToken) break;

        nextToken = response.nextToken;
      }

      return allItems;
    }
  }

  getAssetWithEtag(token: JWT | null, path: string, type: ResourceType, etag: string) {
    const url = this.buildUrl(type, ResourceOperation.GET);

    return this.postAction(url, { path }, token, { [IF_NONE_MATCH]: etag });
  }

  getAsset(token: JWT | null, path: string, type: ResourceType): Promise<DialPrompt | null> {
    const url = this.buildUrl(type, ResourceOperation.GET);

    return this.post(url, { path }, token);
  }

  updateAssetWithEtag(
    token: JWT | null,
    asset: Asset,
    type: ResourceType,
    etag: string,
  ): Promise<ServerActionResponse> {
    const url = this.buildUrl(type, ResourceOperation.UPDATE);
    return this.postAction(url, { ...asset }, token, { [IF_MATCH]: etag });
  }

  updateAsset(token: JWT | null, asset: Asset, type: ResourceType): Promise<ServerActionResponse> {
    const url = this.buildUrl(type, ResourceOperation.UPDATE);
    return this.postAction(url, { ...asset }, token);
  }

  createAsset(asset: Asset, type: ResourceType, token: JWT | null): Promise<ServerActionResponse> {
    const url = this.buildUrl(type, ResourceOperation.CREATE);
    return this.postAction(url, { ...asset, folderId: asset.folderId || ROOT_FOLDER }, token);
  }

  removeAssetWithEtag(
    token: JWT | null,
    path: string,
    type: ResourceType,
    etag?: string,
  ): Promise<ServerActionResponse> {
    const url = this.buildUrl(type, ResourceOperation.DELETE);
    return this.postAction(url, { path }, token, { [IF_MATCH]: etag || DEFAULT_ETAG });
  }

  removeAsset(token: JWT | null, path: string, type: ResourceType): Promise<ServerActionResponse> {
    if (type === ResourceType.FILE) {
      return this.deleteAction(`${ResourceBasePaths[type]}?path=${path}`, token);
    } else {
      const url = this.buildUrl(type, ResourceOperation.DELETE);
      return this.postAction(url, { path }, token);
    }
  }

  bulkDeleteAssets(token: JWT | null, paths: { path: string }[], type: ResourceType): Promise<ServerActionResponse> {
    const url = this.buildUrl(type, ResourceOperation.DELETE_BULK);
    return this.postAction(url, { paths }, token);
  }

  moveAssets(token: JWT | null, paths: string[], newPath: string, type: ResourceType): Promise<ServerActionResponse[]> {
    const url = this.buildUrl(type, ResourceOperation.MOVE);
    const requests = paths.map((path) => {
      const body = {
        sourceUrl: path,
        destinationUrl: changePath(path, newPath),
        overwrite: false,
      };
      return this.postAction(url, { ...body }, token);
    });
    return Promise.all(requests);
  }

  // currently for files - json /import, for prompts - json /import/json need fix from BE when application added
  importAssets(
    token: JWT | null,
    body: FormData,
    fileType: ImportFileType,
    type: ResourceType,
  ): Promise<ServerActionResponse> {
    const url = this.buildUrl(
      type,
      fileType === ImportFileType.ARCHIVE
        ? ResourceOperation.IMPORT_ZIP
        : type === ResourceType.FILE
          ? ResourceOperation.IMPORT
          : ResourceOperation.IMPORT_JSON,
    );
    return this.postFiles(url, body, token);
  }

  exportAssets(
    token: JWT | null,
    type: ResourceType,
    paths?: string[],
    fileType?: ImportFileType,
  ): Promise<{ blob: Blob; fileName: string } | { prompts: DialPrompt[] } | { applications: AssetApp[] }> {
    const url = this.buildUrl(
      type,
      fileType === ImportFileType.ARCHIVE ? ResourceOperation.EXPORT : ResourceOperation.EXPORT_JSON,
    );

    return this.sendRequest(url, 'POST', { paths }, token).then(async (res) => {
      if (fileType === ImportFileType.ARCHIVE) {
        return { blob: await (res as Response)?.blob?.(), fileName: getFileName(res as Response) || '' };
      }

      if (type === ResourceType.PROMPT) {
        return res as { prompts: DialPrompt[] };
      }
      return res as { applications: AssetApp[] };
    });
  }

  // File specific

  downloadFile(token: JWT | null, path: string): Promise<Response> {
    const url = this.buildUrl(ResourceType.FILE, ResourceOperation.DOWNLOAD);
    const filename = getFolderNameAndPath(path).name;
    return this.streamRequest(`${url}?path=${path}`, filename, token);
  }

  previewFile(token: JWT | null, path: string): Promise<Response> {
    const url = this.buildUrl(ResourceType.FILE, ResourceOperation.DOWNLOAD);
    const filename = getFolderNameAndPath(path).name;
    return this.streamRequest(`${url}?path=${path}`, filename, token, true);
  }

  exportFiles(token: JWT | null, paths?: string[]): Promise<{ blob: Blob; fileName: string }> {
    const url = this.buildUrl(ResourceType.FILE, ResourceOperation.EXPORT);
    return this.sendRequest(url, 'POST', { paths }, token).then(async (res) => {
      if ((res as Response).blob) {
        return { blob: await (res as Response).blob(), fileName: getFileName(res as Response) || '' };
      }
      return {
        blob: new Blob(),
        fileName: '',
      };
    });
  }

  // Toolset specific

  getTools(name: string, token: JWT | null) {
    const url = `${ResourceBasePaths[ResourceType.TOOLSET]}/discovered-tools`;
    return this.post(url, { path: name }, token).then((res) => (res as { tools: Tool[] })?.tools || []);
  }

  signInToolset(
    toolset: AssetToolset,
    type: ToolsetAuthCredentialLevel,
    token: JWT | null,
    apiKey?: string,
    authCode?: string,
  ) {
    const url = `${ResourceBasePaths[ResourceType.TOOLSET]}/sign-in`;

    return this.postAction(url, getToolsetSignInBody(toolset, type, apiKey, authCode), token);
  }

  signOutToolset(toolset: AssetToolset, type: ToolsetAuthCredentialLevel, token: JWT | null) {
    const url = `${ResourceBasePaths[ResourceType.TOOLSET]}/sign-out`;

    return this.postAction(url, getToolsetBasicBody(toolset, type), token);
  }
}
