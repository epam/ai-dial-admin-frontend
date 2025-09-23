import { JWT } from 'next-auth/jwt';

import { ROOT_FOLDER } from '@/src/constants/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { getFileName } from '@/src/utils/api/get-file-name';
import { changePath } from '@/src/utils/files/path';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const PROMPTS_URL = `${API}/prompts`;
export const PROMPT_LIST_URL = `${PROMPTS_URL}/list`;
export const PROMPT_GET_URL = `${PROMPTS_URL}/get`;
export const PROMPT_CREATE_URL = `${PROMPTS_URL}/create`;
export const PROMPT_DELETE_URL = `${PROMPTS_URL}/delete`;
export const PROMPT_DELETE_BULK_URL = `${PROMPT_DELETE_URL}/bulk`;
export const PROMPT_VERSIONS_URL = `${PROMPTS_URL}/versions`;
export const PROMPT_MOVE_URL = `${PROMPTS_URL}/move`;
export const PROMPT_EXPORT_URL = `${PROMPTS_URL}/export`;
export const PROMPT_EXPORT_JSON_URL = `${PROMPT_EXPORT_URL}/json`;
export const PROMPT_IMPORT_ZIP_URL = `${PROMPTS_URL}/import/zip`;
export const PROMPT_IMPORT_JSON_URL = `${PROMPTS_URL}/import/json`;

export class PromptsApi extends BaseApi {
  async getPromptsList(token: JWT | null, path: string): Promise<DialPrompt[] | null | undefined> {
    const allItems: DialPrompt[] = [];
    let nextToken: string | undefined = undefined;

    while (true) {
      const body: { path: string; nextToken?: string } = { path };
      if (nextToken) {
        body.nextToken = nextToken;
      }

      const response = (await this.post(PROMPT_LIST_URL, body, token)) as
        | { items: DialPrompt[]; nextToken?: string }
        | undefined;

      if (!response) break;

      if (Array.isArray(response.items) && response.items.length > 0) {
        allItems.push(...response.items);
      }

      if (!response.nextToken) break;

      nextToken = response.nextToken;
    }

    return allItems;
  }

  getPrompt(token: JWT | null, path?: string): Promise<DialPrompt | null> {
    return this.post(PROMPT_GET_URL, { path }, token);
  }

  removePrompt(token: JWT | null, path?: string): Promise<ServerActionResponse> {
    return this.postAction(PROMPT_DELETE_URL, { path }, token);
  }

  createPrompt(prompt: DialPrompt, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(
      PROMPT_CREATE_URL,
      { ...prompt, content: prompt.content || '', folderId: prompt.folderId || ROOT_FOLDER },
      token,
    );
  }

  movePrompts(token: JWT | null, paths: string[], newPath: string): Promise<ServerActionResponse[]> {
    const requests = paths.map((path) => {
      const body = {
        sourceUrl: path,
        destinationUrl: changePath(path, newPath),
        overwrite: false,
      };
      return this.postAction(PROMPT_MOVE_URL, { ...body }, token);
    });
    return Promise.all(requests);
  }

  exportPrompts(
    token: JWT | null,
    paths?: string[],
    type?: ImportFileType,
  ): Promise<{ blob: Blob; fileName: string } | unknown> {
    const url = type === ImportFileType.ARCHIVE ? PROMPT_EXPORT_URL : PROMPT_EXPORT_JSON_URL;
    return this.sendRequest(url, 'POST', { paths }, token).then(async (res) => {
      return type === ImportFileType.ARCHIVE
        ? { blob: await (res as Response).blob(), fileName: getFileName(res as Response) || '' }
        : res;
    });
  }

  importPrompts(token: JWT | null, body: FormData, fileType: ImportFileType): Promise<ServerActionResponse> {
    return this.postFiles(
      fileType === ImportFileType.ARCHIVE ? PROMPT_IMPORT_ZIP_URL : PROMPT_IMPORT_JSON_URL,
      body,
      token,
    );
  }

  bulkDeletePrompts(token: JWT | null, paths: { path: string }[]): Promise<ServerActionResponse> {
    return this.postAction(PROMPT_DELETE_BULK_URL, { paths }, token);
  }
}
