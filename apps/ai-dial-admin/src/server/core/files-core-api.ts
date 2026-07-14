import { CORE_FILES_METADATA_URL, CORE_FILES_URL } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { DialFile } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { encodeCorePath } from '@/src/server/publications/path';
import { createHeadersForCreate, createIfMatchHeaders } from './asset-headers';
import { CoreApi } from './core-api';

export class FilesCoreApi extends CoreApi {
  /**
   * Reads a file/folder metadata node (`GET /v1/metadata/files/{path}`). Files are not
   * versioned, so this carries `contentType`/`contentLength` instead of a `__version` suffix.
   */
  getFileMetadata(token: Token, path: string, recursive = false, nextToken?: string): Promise<DialFile | null> {
    const params = new URLSearchParams({ recursive: String(recursive), permissions: 'false' });
    if (nextToken) {
      // Core reads the continuation marker from the `token` query param but returns it as
      // `nextToken` in the response body — sending it back as `nextToken` is ignored and Core
      // re-serves the first page forever.
      params.set('token', nextToken);
    }
    const url = `${CORE_FILES_METADATA_URL}/${encodeCorePath(path)}?${params.toString()}`;
    return this.get<DialFile>(url, token);
  }

  /** Streams a file's content (`GET /v1/files/{path}`). */
  downloadFile(token: Token, path: string, fileName: string): Promise<Response> {
    return this.streamRequest(`${CORE_FILES_URL}/${encodeCorePath(path)}`, fileName, token);
  }

  /** Streams a file's content for inline preview (`GET /v1/files/{path}`). */
  previewFile(token: Token, path: string, fileName: string): Promise<Response> {
    return this.streamRequest(`${CORE_FILES_URL}/${encodeCorePath(path)}`, fileName, token, true);
  }

  /**
   * Uploads a single file (`PUT /v1/files/{path}`, multipart). Defaults to OVERRIDE semantics
   * (the shape the existing publications file-staging flow relies on); pass
   * `{ overwrite: false }` to instead reject with a precondition-failed response when the
   * target already exists (used by import's SKIP conflict-resolution policy).
   */
  uploadFile(
    token: Token,
    path: string,
    file: File,
    options: { overwrite?: boolean } = {},
  ): Promise<ServerActionResponse> {
    const form = new FormData();
    form.append('file', file);
    const overwrite = options.overwrite ?? true;
    const headers = createHeadersForCreate(overwrite);
    return this.postFiles(`${CORE_FILES_URL}/${encodeCorePath(path)}`, form, token, 'PUT', headers);
  }

  /**
   * Deletes a file (`DELETE /v1/files/{path}`). Requires a real etag and always sends
   * `If-Match` — the admin backend's `FileService.delete` silently ignored its etag
   * parameter and sent no conditional header at all; this is the deliberate bugfix
   * (design D5) rather than a like-for-like port.
   */
  deleteFile(token: Token, path: string, etag: string): Promise<ServerActionResponse> {
    if (!etag) {
      return Promise.reject(
        new Error('deleteFile requires a concrete etag — the admin backend silently ignored a missing one.'),
      );
    }
    const url = `${CORE_FILES_URL}/${encodeCorePath(path)}`;
    return this.sendActionRequest(url, 'DELETE', token, undefined, createIfMatchHeaders(etag));
  }
}
