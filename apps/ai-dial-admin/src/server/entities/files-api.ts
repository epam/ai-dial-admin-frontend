import { JWT } from 'next-auth/jwt';
import { API } from '../api';
import { BaseApi } from '../base-api';

import { DialFile } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { changePath, getFolderNameAndPath } from '@/src/utils/files/path';
import { ImportFileTypes } from '@/src/types/import';
import { getFileName } from '@/src/utils/api/get-file-name';

export const FILES_URL = `${API}/files`;
export const FILE_MOVE_URL = `${FILES_URL}/move`;
export const FILE_DOWNLOAD_URL = `${FILES_URL}/download`;
export const FILE_EXPORT_URL = `${FILES_URL}/export`;
export const FILE_IMPORT_URL = `${FILES_URL}/import`;
export const FILE_IMPORT_ZIP_URL = `${FILE_IMPORT_URL}/zip`;

export class FilesApi extends BaseApi {
  getFilesList(token: JWT | null, path: string): Promise<DialFile[] | null> {
    return this.post(FILES_URL, { path }, token).then((response) => (response as { items: DialFile[] })?.items || []);
  }

  removeFile(token: JWT | null, path?: string): Promise<ServerActionResponse> {
    return this.deleteAction(`${FILES_URL}?path=${path}`, token);
  }

  moveFiles(token: JWT | null, paths: string[], newPath: string): Promise<ServerActionResponse[]> {
    const requests = paths.map((path) => {
      const body = {
        sourceUrl: path,
        destinationUrl: changePath(path, newPath),
        overwrite: false,
      };
      return this.postAction(FILE_MOVE_URL, { ...body }, token);
    });
    return Promise.all(requests);
  }

  downloadFile(token: JWT | null, path: string): Promise<Response> {
    const filename = getFolderNameAndPath(path).name;
    return this.streamRequest(`${FILE_DOWNLOAD_URL}?path=${path}`, filename, token);
  }

  previewFile(token: JWT | null, path: string): Promise<Response> {
    const filename = getFolderNameAndPath(path).name;
    return this.streamRequest(`${FILE_DOWNLOAD_URL}?path=${path}`, filename, token, true);
  }

  importFiles(token: JWT | null, body: FormData, fileType: ImportFileTypes): Promise<ServerActionResponse> {
    return this.postFiles(fileType === ImportFileTypes.ARCHIVE ? FILE_IMPORT_ZIP_URL : FILE_IMPORT_URL, body, token);
  }

  exportFiles(token: JWT | null, paths?: string[]): Promise<{ blob: Blob; fileName: string }> {
    return this.sendRequest(FILE_EXPORT_URL, 'POST', { paths }, token).then(async (res) => {
      if ((res as Response).blob) {
        return { blob: await (res as Response).blob(), fileName: getFileName(res as Response) || '' };
      }
      return {
        blob: new Blob(),
        fileName: '',
      };
    });
  }
}
