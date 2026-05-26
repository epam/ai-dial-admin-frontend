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
import { changePath, extractVersionByPath, getFolderNameAndPath } from '@/src/utils/files/path';
import { getToolsetBasicBody, getToolsetSignInBody } from '@/src/utils/toolset/toolset-auth';
import { BaseApi } from '../../base-api';
import { ResourceBasePaths, ResourceOperation } from './constants';
import { buildAssetUrl } from './utils';
import { DialConversation } from '@/src/models/dial/conversation';
export class AssetsApi extends BaseApi {
  async getAssetList(
    token: Token,
    path: string,
    type: ResourceType,
  ): Promise<Asset[] | DialConversation[] | null | undefined> {
    const url = buildAssetUrl(type, ResourceOperation.LIST);
    if (type === ResourceType.FILE) {
      return this.post(ResourceBasePaths[type], { path }, token).then((response) =>
        response === void 0 ? void 0 : (response as { items: DialFile[] })?.items || [],
      );
    } else {
      const allItems: Asset[] | DialConversation[] = [];
      let nextToken: string | undefined = undefined;

      while (true) {
        const body: { path: string; nextToken?: string } = { path };
        if (nextToken) {
          body.nextToken = nextToken;
        }

        const response = (await this.post(url, body, token)) as
          | { items: Asset[] | DialConversation[]; nextToken?: string }
          | undefined;

        if (!response) break;

        if (Array.isArray(response.items) && response.items.length > 0) {
          allItems.push(...(response.items as Asset[] & DialConversation[]));
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

  moveAssets(
    token: Token,
    paths: string[],
    newPath: string,
    type: ResourceType,
    overwrite = false,
    duplicateName?: string,
  ): Promise<ServerActionResponse[]> {
    const url = buildAssetUrl(type, ResourceOperation.MOVE);
    const requests = paths.map((path) => {
      let destinationUrl = '';
      if (duplicateName) {
        const version = extractVersionByPath(path);
        const newName = version ? `${duplicateName}__${version}` : duplicateName;
        destinationUrl = changePath(path, newPath, newName);
      } else {
        destinationUrl = changePath(path, newPath);
      }

      const body = {
        sourceUrl: path,
        destinationUrl,
        overwrite,
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

  getTools(
    name: string,
    token: Token,
    resourceType: ResourceType = ResourceType.TOOLSET,
  ): Promise<ServerActionResponse<{ tools: Tool[] }>> {
    const url = `${ResourceBasePaths[resourceType]}/discovered-tools`;
    return this.postAction(url, { path: name }, token);
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

  tryOutTool(body: Record<string, unknown>, token: Token, resourceType: ResourceType = ResourceType.TOOLSET) {
    const url = `${ResourceBasePaths[resourceType]}/call-tool`;
    return this.postAction(url, body, token);
  }
}
