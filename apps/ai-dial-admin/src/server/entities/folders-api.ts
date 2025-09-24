import { JWT } from 'next-auth/jwt';
import { API } from '../api';
import { BaseApi } from '../base-api';

import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { ResourceType } from '@/src/types/folder';

export const FOLDERS_URL = `${API}/folders`;
export const FOLDERS_MOVE_URL = `${FOLDERS_URL}/move`;
export const RULES_UPDATE_URL = `${FOLDERS_URL}/updateRules`;
export const FOLDER_CREATE_URL = `${FOLDERS_URL}/upload`;
export const PREVIEW_PROMPT_ZIP = `${API}/prompts/import/zip/preview`;
// delete after add create folder for files, applications
export const PROMPTS_URL = `${API}/prompts`;
export const PROMPT_IMPORT_ZIP_URL = `${PROMPTS_URL}/import/zip`;
export const PROMPT_IMPORT_JSON_URL = `${PROMPTS_URL}/import/json`;

export class FoldersApi extends BaseApi {
  getFolders(token: JWT | null, path: string): Promise<DialFolder[] | null | undefined> {
    return this.post(FOLDERS_URL, { path }, token).then((response) =>
      response === void 0 ? void 0 : (response as { items: DialFolder[] })?.items || [],
    );
  }

  getRules(token: JWT | null, path: string): Promise<Record<string, DialRule[]> | null> {
    return this.get(`${FOLDERS_URL}?path=${path}`, token);
  }

  updateRules(token: JWT | null, targetFolder: string, rules: DialRule[]): Promise<ServerActionResponse> {
    return this.postAction(`${RULES_UPDATE_URL}`, { targetFolder, rules }, token);
  }

  createFolder(token: JWT | null, body: FormData, type?: string): Promise<ServerActionResponse> {
    return this.postFiles(
      `${type === ImportFileType.ARCHIVE ? PROMPT_IMPORT_ZIP_URL : PROMPT_IMPORT_JSON_URL}`,
      body,
      token,
      'POST',
    );
  }

  previewPromptZipFiles(token: JWT | null, body: FormData): Promise<ServerActionResponse> {
    return this.postFiles(`${PREVIEW_PROMPT_ZIP}`, body, token, 'POST');
  }

  deleteFolder(token: JWT | null, path: string): Promise<ServerActionResponse> {
    return this.deleteAction(`${FOLDERS_URL}?path=${path}`, token);
  }

  changeFolder(
    token: JWT | null,
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
