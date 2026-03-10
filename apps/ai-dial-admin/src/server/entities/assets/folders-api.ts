import { Token } from '@/src/models/auth';
import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import { API } from '../../api';
import { BaseApi } from '../../base-api';
import { buildCreateFolderUrl } from './utils';

export const FOLDERS_URL = `${API}/folders`;
export const FOLDERS_MOVE_URL = `${FOLDERS_URL}/move`;
export const RULES_UPDATE_URL = `${FOLDERS_URL}/updateRules`;
export const FOLDER_CREATE_URL = `${FOLDERS_URL}/upload`;
export const PREVIEW_PROMPT_ZIP = `${API}/prompts/import/zip/preview`;
export const PREVIEW_APP_ZIP = `${API}/application-resources/import/zip/preview`;
export const PREVIEW_TOOLSET_ZIP = `${API}/toolset-resources/import/zip/preview`;

export class FoldersApi extends BaseApi {
  getFolders(token: Token, path: string): Promise<DialFolder[] | null | undefined> {
    return this.post(FOLDERS_URL, { path }, token).then((response) =>
      response === void 0 ? void 0 : (response as { items: DialFolder[] })?.items || [],
    );
  }

  getRules(token: Token, path: string): Promise<ServerActionResponse<Record<string, DialRule[]>>> {
    return this.getAction(`${FOLDERS_URL}?path=${path}`, token);
  }

  updateRules(token: Token, targetFolder: string, rules: DialRule[]): Promise<ServerActionResponse> {
    return this.postAction(`${RULES_UPDATE_URL}`, { targetFolder, rules }, token);
  }

  createFolder(token: Token, body: FormData, type?: string, view?: ApplicationRoute): Promise<ServerActionResponse> {
    const url = buildCreateFolderUrl(type, view);
    return this.postFiles(url, body, token, 'POST');
  }

  previewPromptZipFiles(token: Token, body: FormData): Promise<ServerActionResponse> {
    return this.postFiles(`${PREVIEW_PROMPT_ZIP}`, body, token, 'POST');
  }

  previewAppZipFiles(token: Token, body: FormData): Promise<ServerActionResponse> {
    return this.postFiles(`${PREVIEW_APP_ZIP}`, body, token, 'POST');
  }

  previewToolsetZipFiles(token: Token, body: FormData): Promise<ServerActionResponse> {
    return this.postFiles(`${PREVIEW_TOOLSET_ZIP}`, body, token, 'POST');
  }

  deleteFolder(token: Token, path: string): Promise<ServerActionResponse> {
    return this.deleteAction(`${FOLDERS_URL}?path=${path}`, token);
  }

  changeFolder(
    token: Token,
    oldPath: string,
    newPath: string,
    resourceType: ResourceType,
  ): Promise<ServerActionResponse> {
    return this.postAction(
      `${FOLDERS_MOVE_URL}`,
      {
        oldPath,
        newPath,
        resourceTypes: [resourceType],
      },
      token,
    );
  }
}
