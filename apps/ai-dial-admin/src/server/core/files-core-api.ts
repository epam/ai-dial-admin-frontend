import { CORE_FILES_METADATA_URL, CORE_FILES_URL } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { DialFile } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { encodeCorePath } from '@/src/server/publications/path';
import { CoreApi } from './core-api';

export class FilesCoreApi extends CoreApi {
  /** Reads a file/folder metadata node (`GET /v1/metadata/files/{path}`). */
  getFileMetadata(token: Token, path: string, recursive = false): Promise<DialFile | null> {
    const url = `${CORE_FILES_METADATA_URL}/${encodeCorePath(path)}?recursive=${recursive}&permissions=false`;
    return this.get<DialFile>(url, token);
  }

  /** Uploads a single file with OVERRIDE semantics (`PUT /v1/files/{path}`, multipart). */
  uploadFile(token: Token, path: string, file: File): Promise<ServerActionResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.postFiles(`${CORE_FILES_URL}/${encodeCorePath(path)}`, form, token, 'PUT');
  }
}
