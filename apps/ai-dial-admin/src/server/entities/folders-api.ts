import { JWT } from 'next-auth/jwt';
import { API } from '../api';
import { BaseApi } from '../base-api';

import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { PROMPT_IMPORT_JSON_URL, PROMPT_IMPORT_ZIP_URL } from './prompts-api';

export const FOLDERS_URL = `${API}/folders`;
export const RULES_UPDATE_URL = `${FOLDERS_URL}/updateRules`;
export const FOLDER_CREATE_URL = `${FOLDERS_URL}/upload`;
export const PREVIEW_PROMPT_ZIP = `${API}/prompts/import/zip/preview`;

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
}
