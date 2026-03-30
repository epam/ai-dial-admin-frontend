import { DEFAULT_ETAG, IF_MATCH, IF_NONE_MATCH } from '@/src/constants/api-headers';
import { ROOT_FOLDER } from '@/src/constants/file';
import { Token } from '@/src/models/auth';
import { Asset, AssetToolset, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Tool, ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { getFileName } from '@/src/utils/api/get-file-name';
import { changePath, getFolderNameAndPath } from '@/src/utils/files/path';
import { getToolsetBasicBody, getToolsetSignInBody } from '@/src/utils/toolset/toolset-auth';
import { BaseApi } from '../../base-api';
import { ResourceBasePaths, ResourceOperation } from './constants';
import { buildAssetUrl } from './utils';
export class AssetsApi extends BaseApi {
  async getAssetList(token: Token, path: string, type: ResourceType): Promise<Asset[] | null | undefined> {
    const url = buildAssetUrl(type, ResourceOperation.LIST);
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

  getAssetWithEtag(token: Token, path: string, type: ResourceType, etag: string) {
    const url = buildAssetUrl(type, ResourceOperation.GET);

    return this.postAction(url, { path }, token, { [IF_NONE_MATCH]: etag });
  }

  getAsset(token: Token, path: string, type: ResourceType): Promise<DialPrompt | null> {
    const url = buildAssetUrl(type, ResourceOperation.GET);

    return this.post(url, { path }, token);
  }

  updateAssetWithEtag(
    token: Token,
    asset: AssetWithVersion,
    type: ResourceType,
    etag: string,
  ): Promise<ServerActionResponse> {
    const url = buildAssetUrl(type, ResourceOperation.UPDATE);
    return this.postAction(url, { ...asset }, token, { [IF_MATCH]: etag });
  }

  updateAsset(token: Token, asset: AssetWithVersion, type: ResourceType): Promise<ServerActionResponse> {
    const url = buildAssetUrl(type, ResourceOperation.UPDATE);
    return this.postAction(url, { ...asset }, token);
  }

  createAsset(asset: AssetWithVersion, type: ResourceType, token: Token): Promise<ServerActionResponse> {
    const url = buildAssetUrl(type, ResourceOperation.CREATE);
    return this.postAction(url, { ...asset, folderId: asset.folderId || ROOT_FOLDER }, token);
  }

  removeAssetWithEtag(token: Token, path: string, type: ResourceType, etag?: string): Promise<ServerActionResponse> {
    const url = buildAssetUrl(type, ResourceOperation.DELETE);
    return this.postAction(url, { path }, token, { [IF_MATCH]: etag || DEFAULT_ETAG });
  }

  removeAsset(token: Token, path: string, type: ResourceType): Promise<ServerActionResponse> {
    if (type === ResourceType.FILE) {
      return this.deleteAction(`${ResourceBasePaths[type]}?path=${path}`, token);
    } else {
      const url = buildAssetUrl(type, ResourceOperation.DELETE);
      return this.postAction(url, { path }, token);
    }
  }

  bulkDeleteAssets(token: Token, paths: { path: string }[], type: ResourceType): Promise<ServerActionResponse> {
    const url = buildAssetUrl(type, ResourceOperation.DELETE_BULK);
    return this.postAction(url, { paths }, token);
  }

  moveAssets(token: Token, paths: string[], newPath: string, type: ResourceType): Promise<ServerActionResponse[]> {
    const url = buildAssetUrl(type, ResourceOperation.MOVE);
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

  importAssets(
    token: Token,
    body: FormData,
    fileType: ImportFileType,
    type: ResourceType,
  ): Promise<ServerActionResponse> {
    const url = buildAssetUrl(
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
    token: Token,
    type: ResourceType,
    paths?: string[],
    fileType?: ImportFileType,
  ): Promise<{ blob: Blob; fileName: string } | unknown> {
    const url = buildAssetUrl(
      type,
      fileType === ImportFileType.ARCHIVE ? ResourceOperation.EXPORT : ResourceOperation.EXPORT_JSON,
    );

    return this.sendRequest(url, 'POST', { paths }, token).then(async (res) => {
      if (fileType === ImportFileType.ARCHIVE) {
        return { blob: await (res as Response)?.blob?.(), fileName: getFileName(res as Response) || '' };
      }
      return res;
    });
  }

  // File specific

  downloadFile(token: Token, path: string): Promise<Response> {
    const url = buildAssetUrl(ResourceType.FILE, ResourceOperation.DOWNLOAD);
    const filename = getFolderNameAndPath(path).name;
    return this.streamRequest(`${url}?path=${path}`, filename, token);
  }

  previewFile(token: Token, path: string): Promise<Response> {
    const url = buildAssetUrl(ResourceType.FILE, ResourceOperation.DOWNLOAD);
    const filename = getFolderNameAndPath(path).name;
    return this.streamRequest(`${url}?path=${path}`, filename, token, true);
  }

  exportFiles(token: Token, paths?: string[]): Promise<{ blob: Blob; fileName: string }> {
    const url = buildAssetUrl(ResourceType.FILE, ResourceOperation.EXPORT);
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

  getTools(name: string, token: Token) {
    const url = `${ResourceBasePaths[ResourceType.TOOLSET]}/discovered-tools`;
    return this.post(url, { path: name }, token).then((res) => (res as { tools: Tool[] })?.tools || []);
  }

  signInToolset(
    toolset: AssetToolset,
    type: ToolsetAuthCredentialLevel,
    token: Token,
    redirectUri?: string,
    apiKey?: string,
    authCode?: string,
  ) {
    const url = `${ResourceBasePaths[ResourceType.TOOLSET]}/sign-in`;

    return this.postAction(url, getToolsetSignInBody(toolset, type, apiKey, authCode, redirectUri), token);
  }

  signOutToolset(toolset: AssetToolset, type: ToolsetAuthCredentialLevel, token: Token) {
    const url = `${ResourceBasePaths[ResourceType.TOOLSET]}/sign-out`;

    return this.postAction(url, getToolsetBasicBody(toolset, type), token);
  }

  tryOutTool(body: Record<string, unknown>, token: Token) {
    const url = `${ResourceBasePaths[ResourceType.TOOLSET]}/call-tool`;
    return this.postAction(url, body, token);
  }
}
