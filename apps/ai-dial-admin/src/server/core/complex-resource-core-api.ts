import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { DialComplexResource, DialComplexResourceFile } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { decodeCorePath, encodeCorePath, stripPrefix } from '@/src/server/publications/path';
import { sendRequest } from '@/src/utils/api/send-request';
import { getError, getErrorMessage } from '@/src/utils/api/error';
import { getApiHeaders } from '@/src/utils/auth/api-headers';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { BaseApiConfig } from '@/src/server/base-api';
import { ResourceType } from '@/src/types/resource-type';
import { createHeadersForCreate, createIfMatchHeaders } from './asset-headers';
import { CoreResourceMetadataNode } from './asset-metadata';
import { CoreApi } from './core-api';

/**
 * Binds the shared client to one of Core's "complex resource" groups: versioned multi-file resources
 * served by `ComplexResourceController` under `v2/{group}` (content) and `v2/metadata/{group}`.
 */
export interface ComplexResourceGroup {
  type: ResourceType;
  contentUrl: string;
  metadataUrl: string;
  /** Mandatory manifest filename at the resource root (`SKILL.md`, `PROJECT.md`). */
  manifestFile: string;
}

interface CoreComplexResourceMetadataItem {
  name: string;
  url?: string;
  nodeType?: string;
}

interface CoreComplexResourceFilesMetadata {
  items?: CoreComplexResourceMetadataItem[];
}

/**
 * Core client for any complex resource group. The group-specific clients (`SkillsCoreApi`,
 * `ProjectsCoreApi`) only bind URLs and the manifest name, and expose the operations under their own names.
 */
export abstract class ComplexResourceCoreApi extends CoreApi {
  protected readonly group: ComplexResourceGroup;

  protected constructor(config: BaseApiConfig, group: ComplexResourceGroup) {
    super(config);
    this.group = group;
  }

  /**
   * Reads a resource's path/folderId, etag, author/created/updated, and files. `GET
   * /v2/metadata/{group}/{bucket}/{path}` on the resource's own path (no trailing slash) answers with that
   * resource as a single `ITEM` carrying `nodeType`/`createdAt`/`updatedAt`/`author`/`etag` (Core ≥
   * 0.48.0); no manifest field is exposed through *any* metadata endpoint — those live only in the
   * manifest's YAML frontmatter. The parent folder's listing is deliberately not scanned for this: Core
   * pages it over raw blobs (every file and version of every resource), so a resource's row can sit on any
   * page. A `null` response or a non-`ITEM` node (Core's answer for a path that is not a resource) means the
   * resource doesn't exist. The trio nests under `_metadata` (epoch milliseconds stringified, matching the
   * asset merge formatters' convention); `etag` stays a separate value, outside `_metadata`. The only fetch
   * beyond that read is {@link getResourceFiles}, since the `ITEM` node carries no file contents.
   */
  protected async getResourceMetadata(token: Token, path: string): Promise<DialComplexResource | null> {
    const [files, node] = await Promise.all([
      this.getResourceFiles(token, path),
      this.get<CoreResourceMetadataNode>(`${this.group.metadataUrl}/${encodeCorePath(path)}`, token),
    ]);

    if (node?.nodeType !== 'ITEM') {
      return null;
    }

    const separatorIndex = path.lastIndexOf('/');
    const folderId = separatorIndex === -1 ? '' : path.slice(0, separatorIndex + 1);
    const name = separatorIndex === -1 ? path : path.slice(separatorIndex + 1);

    return {
      name,
      path,
      folderId,
      etag: node.etag,
      _metadata: {
        author: node.author,
        createdAt: node.createdAt !== undefined ? String(node.createdAt) : undefined,
        updatedAt: node.updatedAt !== undefined ? String(node.updatedAt) : undefined,
      },
      files,
    };
  }

  /**
   * Lists the files contained in a resource's bundle (`GET /v2/metadata/{group}/{bucket}/{path}/files`,
   * recursive) — a dedicated sub-route, distinct from {@link getResourceMetadata}'s own item metadata: a
   * resource's own path resolves to an `ITEM` node with no `items`, so its files can only be read through
   * this `/files` listing. Each row's `name` is the file's path relative to the resource root (e.g.
   * `scripts/run.sh`), derived from the listing's `url` so nested files stay distinguishable;
   * grouping-folder entries within the bundle are excluded, only `ITEM` rows are returned. Core doesn't
   * report a file's size on this listing, so the row carries none.
   */
  protected async getResourceFiles(token: Token, path: string): Promise<DialComplexResourceFile[]> {
    const params = new URLSearchParams({ recursive: 'true' });
    const url = `${this.group.metadataUrl}/${encodeCorePath(path)}/files?${params.toString()}`;
    const res = await this.get<CoreComplexResourceFilesMetadata>(url, token);
    // The listing's own `url` is rooted under the resource's internal `files/` sub-namespace
    // (`{group}/{bucket}/{path}/files/...`), not its bare path — the prefix to strip must include that
    // segment, or every name comes back with a stray leading `files/`. `item.url` comes back encoded
    // (segment-by-segment, like every other Core listing `url`), so the prefix must be built from the
    // encoded path too — comparing it against the raw `path` silently failed to strip whenever the path
    // needed encoding (e.g. a folder name with a space).
    const prefix = `${RESOURCE_TYPE_PREFIX[this.group.type]}${encodeCorePath(path)}/files/`;
    return (res?.items ?? [])
      .filter((item) => (item.nodeType ?? 'ITEM').toUpperCase() !== 'FOLDER')
      .map((item) => ({
        name: item.url ? decodeCorePath(stripPrefix(item.url, prefix)) : item.name,
      }));
  }

  /**
   * Uploads (creates or replaces) a single file within a resource's bundle
   * (`PUT /v2/{group}/{bucket}/{path}/files/{filePath}`, multipart). Defaults to overwrite semantics,
   * matching `FilesCoreApi.uploadFile`.
   */
  protected uploadResourceFile(
    token: Token,
    path: string,
    filePath: string,
    file: File,
    options: { overwrite?: boolean } = {},
  ): Promise<ServerActionResponse> {
    const form = new FormData();
    form.append('file', file);
    const overwrite = options.overwrite ?? true;
    const headers = createHeadersForCreate(overwrite);
    const url = `${this.group.contentUrl}/${encodeCorePath(path)}/files/${encodeCorePath(filePath)}`;
    return this.postFiles(url, form, token, 'PUT', headers);
  }

  /**
   * Creates a brand-new resource (`PUT /v2/{group}/{bucket}/{path}`, multipart, a single manifest part) —
   * the only Core route capable of creating a resource from scratch. Unlike {@link uploadResourceFile},
   * which only mutates a file inside an *already-existing* bundle, this targets the whole-bundle route.
   * Create-only: sends `If-None-Match: *` (via the same `createHeadersForCreate` convention
   * `AssetApi.put` already uses for every other type's create), so Core rejects the call rather than
   * overwriting a resource that already exists at this path.
   */
  protected createResource(token: Token, path: string, manifestContent: string): Promise<ServerActionResponse> {
    const manifest = new File([manifestContent], this.group.manifestFile, { type: 'text/markdown' });
    const form = new FormData();
    form.append('file', manifest);
    const headers = createHeadersForCreate(false);
    const url = `${this.group.contentUrl}/${encodeCorePath(path)}`;
    return this.postFiles(url, form, token, 'PUT', headers);
  }

  /**
   * Creates an empty grouping folder (`PUT /v2/{group}/{bucket}/{path}/` — trailing slash, no body),
   * distinct from {@link createResource}'s whole-bundle route (no trailing slash).
   */
  protected createResourceFolder(token: Token, path: string): Promise<ServerActionResponse> {
    // `path` isn't reliably trailing-slash-free from every caller (e.g. a folder row's own path carries
    // one) — normalizing here, rather than trusting each call site, keeps this route's own
    // one-appended-slash contract from ever producing a `//` Core doesn't resolve.
    const url = `${this.group.contentUrl}/${encodeCorePath(removeTrailingSlash(path))}/`;
    return this.sendActionRequest(url, 'PUT', token);
  }

  /**
   * Reads the manifest's raw content as text (`GET /v2/{group}/{bucket}/{path}/files/{manifest}`).
   * Deliberately bypasses `getAction`/`get`: `BaseApi`'s shared response parsing assumes a body is either
   * JSON or `text/plain` and falls back to `res.json().catch(() => res.text().catch(...))` for anything
   * else — but a `Response` body can only be read once, so when Core returns the manifest with its own
   * content type (e.g. `text/markdown`, whatever it was uploaded as), the failed `res.json()` already
   * consumes the stream and the fallback `res.text()` comes back empty. Reading `res.text()` directly,
   * once, sidesteps that. Not the download/preview methods either: those return a streamed `Response`
   * meant to be piped straight to the browser, not read as a string server-side.
   */
  protected async getManifestContent(token: Token, path: string): Promise<ServerActionResponse> {
    const url = `${this.config.host || ''}${this.group.contentUrl}/${encodeCorePath(path)}/files/${this.group.manifestFile}`;
    const res = await sendRequest(url, 'GET', getApiHeaders(token));
    const etag = res.headers.get('etag') || undefined;
    const content = await res.text();

    if (!(res.status >= 200 && res.status < 300)) {
      const errObject = this.parseErrorBody(content, res.status);
      return {
        success: false,
        errorMessage: getErrorMessage(errObject, res.status),
        errorHeader: getError(errObject),
        status: res.status,
        etag,
      };
    }

    return { success: true, response: content, etag };
  }

  /** Streams a single file's content from a resource's bundle for download. */
  protected downloadResourceFile(token: Token, path: string, filePath: string): Promise<Response> {
    const url = `${this.group.contentUrl}/${encodeCorePath(path)}/files/${encodeCorePath(filePath)}`;
    return this.streamRequest(url, filePath.split('/').pop() || filePath, token);
  }

  /** Streams a single file's content from a resource's bundle for inline preview. */
  protected previewResourceFile(token: Token, path: string, filePath: string): Promise<Response> {
    const url = `${this.group.contentUrl}/${encodeCorePath(path)}/files/${encodeCorePath(filePath)}`;
    return this.streamRequest(url, filePath.split('/').pop() || filePath, token, true);
  }

  /**
   * Deletes a single file within a resource's bundle (`DELETE /v2/{group}/{bucket}/{path}/files/{filePath}`).
   * Unlike {@link deleteResource}, the etag is optional — Core's per-file route accepts an unconditional
   * delete, and callers that don't need concurrency protection aren't forced to thread one through.
   */
  protected deleteResourceFile(
    token: Token,
    path: string,
    filePath: string,
    etag?: string,
  ): Promise<ServerActionResponse> {
    const url = `${this.group.contentUrl}/${encodeCorePath(path)}/files/${encodeCorePath(filePath)}`;
    return this.sendActionRequest(url, 'DELETE', token, undefined, etag ? createIfMatchHeaders(etag) : undefined);
  }

  /**
   * Lists the direct children of a folder path (`GET /v2/metadata/{group}/{bucket}/{path}`) — the
   * folder-listing sibling of {@link getResourceMetadata}: metadata-only, one Core request per page, no
   * per-child content or manifest fetch. Returns Core's raw metadata node (shared
   * `CoreResourceMetadataNode` shape) so callers can feed it through the group's list mapper.
   */
  protected async listResourceMetadata(
    token: Token,
    path: string,
    options: { nextToken?: string; limit?: number } = {},
  ): Promise<CoreResourceMetadataNode | null> {
    const params = new URLSearchParams();
    params.set('recursive', 'false');
    if (options.nextToken) {
      params.set('token', options.nextToken);
    }
    if (options.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    const url = `${this.group.metadataUrl}/${encodeCorePath(path)}?${params.toString()}`;
    return this.get<CoreResourceMetadataNode>(url, token);
  }

  /**
   * Deletes a resource (`DELETE /v2/{group}/{bucket}/{path}`). Requires a real etag and always sends
   * `If-Match` — mirrors `FilesCoreApi.deleteFile`'s required-etag guard. The generic `AssetApi` cannot be
   * used here: its delete builds the URL from a `v1/...` path Core does not serve for complex resources.
   */
  protected deleteResource(token: Token, path: string, etag: string): Promise<ServerActionResponse> {
    if (!etag) {
      return Promise.reject(
        new Error(
          `Deleting a ${this.group.type.toLowerCase()} requires a concrete etag — Core rejects an unconditional delete.`,
        ),
      );
    }
    const url = `${this.group.contentUrl}/${encodeCorePath(path)}`;
    return this.sendActionRequest(url, 'DELETE', token, undefined, createIfMatchHeaders(etag));
  }

  /**
   * Deletes a DIAL grouping folder marker (`DELETE /v2/{group}/{bucket}/{path}/` — trailing slash). A
   * different Core route from {@link deleteResource}: `ComplexResourceController` dispatches on the
   * trailing slash alone (`folderOp`) to `deleteFolderTarget`/`ComplexResourceService.deleteFolder`, which
   * rejects with a conflict if the folder is not empty, rather than removing a whole tree.
   */
  protected deleteResourceFolder(token: Token, path: string, etag: string): Promise<ServerActionResponse> {
    if (!etag) {
      return Promise.reject(
        new Error(
          `Deleting a ${this.group.type.toLowerCase()} folder requires a concrete etag — Core rejects an unconditional delete.`,
        ),
      );
    }
    // Same normalization as `createResourceFolder` — a folder row's own path may already carry a trailing
    // slash, and this route appends its own.
    const url = `${this.group.contentUrl}/${encodeCorePath(removeTrailingSlash(path))}/`;
    return this.sendActionRequest(url, 'DELETE', token, undefined, createIfMatchHeaders(etag));
  }
}
