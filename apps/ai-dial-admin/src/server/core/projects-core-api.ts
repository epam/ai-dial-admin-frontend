import { CORE_PROJECTS_METADATA_URL, CORE_PROJECTS_URL } from '@/src/constants/publications-core';
import {
  PROJECT_ARCHIVE_READ_MAX_BYTES,
  PROJECT_ARCHIVE_READ_TIMEOUT_MS,
  PROJECT_MANIFEST_FILE,
} from '@/src/constants/project';
import { Token } from '@/src/models/auth';
import { DialProjectFile, DialProjectResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { BaseApiConfig } from '@/src/server/base-api';
import { errorObjLog } from '@/src/server/logger';
import { encodeCorePath } from '@/src/server/publications/path';
import { ResourceType } from '@/src/types/resource-type';
import { sendRequest } from '@/src/utils/api/send-request';
import { getApiHeaders } from '@/src/utils/auth/api-headers';
import { buildProjectManifest } from '@/src/utils/project-manifest';
import { CoreResourceMetadataNode } from './asset-metadata';
import { ComplexResourceCoreApi } from './complex-resource-core-api';
import { readArchiveFileSizes, readBodyWithin } from './project-archive';

/**
 * Projects' `v2/projects` Core client. Every operation lives in {@link ComplexResourceCoreApi}; this class
 * only binds the Projects routes and the `PROJECT.md` manifest.
 */
export class ProjectsCoreApi extends ComplexResourceCoreApi {
  constructor(config: BaseApiConfig) {
    super(config, {
      type: ResourceType.PROJECT,
      contentUrl: CORE_PROJECTS_URL,
      metadataUrl: CORE_PROJECTS_METADATA_URL,
      manifestFile: PROJECT_MANIFEST_FILE,
    });
  }

  /**
   * Reads the project like any complex resource, then adds each file's size: Core's metadata and `/files`
   * listing carry none, so they come from the project archive (see {@link getProjectArchiveSizes}). The archive is
   * only requested once the project is known to exist — most callers of this on a publication ask about a target
   * that doesn't — at the cost of one round trip when it does. A file keeps no `size` when the archive can't be
   * read: the page still loads, the capacity meter just can't count it.
   */
  async getProjectMetadata(token: Token, path: string): Promise<DialProjectResource | null> {
    const project = await this.getResourceMetadata(token, path);
    if (!project) {
      return null;
    }
    const sizes = await this.getProjectArchiveSizes(token, path);
    if (!sizes) {
      return project;
    }
    return { ...project, files: project.files.map((file) => ({ ...file, size: sizes.get(file.name) })) };
  }

  /**
   * Sizes of the project's files, from the central directory of the whole-bundle archive
   * (`GET /v2/projects/{bucket}/{path}`), which is buffered under {@link PROJECT_ARCHIVE_READ_MAX_BYTES} (counted as
   * it streams, so a response with no declared length is bounded too) and not inflated. `undefined` when the archive is missing, too large, unreadable or slower than
   * {@link PROJECT_ARCHIVE_READ_TIMEOUT_MS}; never throws, since sizes only
   * improve a display.
   */
  async getProjectArchiveSizes(token: Token, path: string): Promise<Map<string, number> | undefined> {
    try {
      const url = `${this.config.host || ''}${this.group.contentUrl}/${encodeCorePath(path)}`;
      // The same signal covers the headers and the body, so a stall at either point ends the wait.
      const signal = AbortSignal.timeout(PROJECT_ARCHIVE_READ_TIMEOUT_MS);
      const res = await sendRequest(url, 'GET', getApiHeaders(token), undefined, signal);
      if (!(res.status >= 200 && res.status < 300)) {
        await res.body?.cancel();
        return undefined;
      }
      const archive = await readBodyWithin(res, PROJECT_ARCHIVE_READ_MAX_BYTES);
      return archive && (await readArchiveFileSizes(archive));
    } catch (e) {
      errorObjLog(e, 'Failed to read project archive sizes');
      return undefined;
    }
  }

  getProjectFiles(token: Token, path: string): Promise<DialProjectFile[]> {
    return this.getResourceFiles(token, path);
  }

  uploadProjectFile(
    token: Token,
    path: string,
    filePath: string,
    file: File,
    options: { overwrite?: boolean } = {},
  ): Promise<ServerActionResponse> {
    return this.uploadResourceFile(token, path, filePath, file, options);
  }

  /** Creates a manifest-only project: a single `PROJECT.md` with the name/description and empty instructions. */
  createProject(token: Token, path: string, name: string, description: string): Promise<ServerActionResponse> {
    return this.createResource(token, path, buildProjectManifest('', { name, description, instructions: '' }));
  }

  createProjectFolder(token: Token, path: string): Promise<ServerActionResponse> {
    return this.createResourceFolder(token, path);
  }

  getProjectManifestContent(token: Token, path: string): Promise<ServerActionResponse> {
    return this.getManifestContent(token, path);
  }

  downloadProjectFile(token: Token, path: string, filePath: string): Promise<Response> {
    return this.downloadResourceFile(token, path, filePath);
  }

  deleteProjectFile(token: Token, path: string, filePath: string, etag?: string): Promise<ServerActionResponse> {
    return this.deleteResourceFile(token, path, filePath, etag);
  }

  listProjectMetadata(
    token: Token,
    path: string,
    options: { nextToken?: string; limit?: number } = {},
  ): Promise<CoreResourceMetadataNode | null> {
    return this.listResourceMetadata(token, path, options);
  }

  deleteProject(token: Token, path: string, etag: string): Promise<ServerActionResponse> {
    return this.deleteResource(token, path, etag);
  }

  deleteProjectFolder(token: Token, path: string, etag: string): Promise<ServerActionResponse> {
    return this.deleteResourceFolder(token, path, etag);
  }
}
