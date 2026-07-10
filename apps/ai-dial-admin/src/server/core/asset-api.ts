import {
  CORE_RESOURCE_METADATA_URL,
  CORE_RESOURCE_MOVE_URL,
  CORE_RESOURCE_URL,
  DEFAULT_LIST_LIMIT,
  DEFAULT_LIST_PATH,
  DEFAULT_LIST_PATH_TYPES,
} from '@/src/constants/assets-core';
import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { encodeCorePath } from '@/src/server/publications/path';
import { ResourceType } from '@/src/types/resource-type';
import { CoreApi } from './core-api';
import { createHeadersForCreate, createIfMatchHeaders, createIfNoneMatchHeaders } from './asset-headers';
import { ASSET_MERGERS, CoreResourceMetadataNode, ResourceInfo, toResourceInfoList } from './asset-metadata';

export interface GetMetadataOptions {
  recursive?: boolean;
  nextToken?: string;
  limit?: number;
}

/**
 * Resource types whose Core content schema requires an `id` field (equal to the resource's
 * own prefixed path) on every write. Confirmed against the backend's `PromptClientMapper` —
 * only prompts have this requirement; toolset/application resource DTOs carry no `id` field.
 */
const RESOURCE_TYPES_REQUIRING_CONTENT_ID: ReadonlySet<ResourceType> = new Set([ResourceType.PROMPT]);

/**
 * Generic direct-to-Core client for the four versioned asset types (application-resource,
 * toolset-resource, conversation, prompt). File has its own client (`FilesCoreApi`) — it has
 * no version suffix and a different metadata shape (see design D1's "not five classes, and
 * File is the outlier" decision).
 */
export class AssetApi extends CoreApi {
  /** Reads a resource's metadata node (`GET /v1/metadata/{type}/{path}`), optionally recursive/paginated. */
  getMetadata(
    token: Token,
    type: ResourceType,
    path: string,
    options: GetMetadataOptions = {},
  ): Promise<CoreResourceMetadataNode | null> {
    const resolvedPath = this.resolveListPath(type, path);
    const params = new URLSearchParams();
    params.set('recursive', String(options.recursive ?? false));
    if (options.nextToken) {
      // Core reads the continuation marker from the `token` query param but returns it as
      // `nextToken` in the response body — sending it back as `nextToken` is ignored and Core
      // re-serves the first page forever.
      params.set('token', options.nextToken);
    }
    const limit = options.limit ?? (DEFAULT_LIST_PATH_TYPES.has(type) ? DEFAULT_LIST_LIMIT : undefined);
    if (limit !== undefined) {
      params.set('limit', String(limit));
    }
    const url = `${CORE_RESOURCE_METADATA_URL[type]}${encodeCorePath(resolvedPath)}?${params.toString()}`;
    return this.get<CoreResourceMetadataNode>(url, token);
  }

  /** Lists the items directly under a folder as lightweight rows (metadata only, no content fetch). */
  async list(token: Token, type: ResourceType, path: string): Promise<ResourceInfo[]> {
    const prefix = RESOURCE_TYPE_PREFIX[type];
    const items: ResourceInfo[] = [];
    let nextToken: string | undefined;
    while (true) {
      const node = await this.getMetadata(token, type, path, { recursive: false, nextToken });
      items.push(...toResourceInfoList(node, prefix));
      nextToken = node?.nextToken;
      if (!nextToken) {
        break;
      }
    }
    return items;
  }

  /** Reads a resource's content DTO (`GET /v1/{type}/{path}`), conditionally on `etag`. */
  getContent<T extends object>(token: Token, type: ResourceType, path: string, etag?: string): Promise<T | null> {
    const url = `${CORE_RESOURCE_URL[type]}${encodeCorePath(path)}`;
    return this.get<T>(url, token, createIfNoneMatchHeaders(etag));
  }

  /**
   * Fetches and merges a resource's content + metadata into the frontend model shape
   * (backend `*ClientMapper` equivalent). Sequential, not parallel, so mock/test ordering
   * and any future rate-limiting stay simple to reason about.
   */
  async getMerged<T>(token: Token, type: ResourceType, path: string, etag?: string): Promise<T | null> {
    const merge = ASSET_MERGERS[type];
    if (!merge) {
      throw new Error(`No content+metadata mapper registered for resource type: ${type}`);
    }
    const content = await this.getContent<Record<string, unknown>>(token, type, path, etag);
    if (!content) {
      return null;
    }
    const metadata = await this.getMetadata(token, type, path);
    if (!metadata) {
      return null;
    }
    return merge(content, metadata) as T;
  }

  /**
   * Fetches and merges a resource's content + metadata, returning the same
   * `ServerActionResponse<T>` shape (with the content resource's current `etag`) that
   * `BaseApi`'s `*ActionWithEtag` methods produce — the contract callers like
   * `getConversation` need when they must thread the etag back to the caller for a
   * subsequent conditional write.
   */
  async getMergedWithEtag<T extends object>(
    token: Token,
    type: ResourceType,
    path: string,
    etag?: string,
  ): Promise<ServerActionResponse<T>> {
    const merge = ASSET_MERGERS[type];
    if (!merge) {
      throw new Error(`No content+metadata mapper registered for resource type: ${type}`);
    }
    const url = `${CORE_RESOURCE_URL[type]}${encodeCorePath(path)}`;
    const contentResult = await this.sendActionRequest(url, 'GET', token, undefined, createIfNoneMatchHeaders(etag));
    if (!contentResult.success) {
      return contentResult as ServerActionResponse<T>;
    }
    const metadata = await this.getMetadata(token, type, path);
    if (!metadata) {
      return { success: false, errorHeader: 'Not Found', errorMessage: 'Resource metadata not found' };
    }
    const merged = merge(contentResult.response as Record<string, unknown>, metadata) as T;
    return { success: true, response: merged, etag: contentResult.etag };
  }

  /** Creates (rejects if already present, unless `allowOverride`) or updates a resource (`PUT /v1/{type}/{path}`). */
  put<T extends object>(
    token: Token,
    type: ResourceType,
    path: string,
    body: T,
    options: { allowOverride?: boolean; etag?: string } = {},
  ): Promise<ServerActionResponse> {
    const url = `${CORE_RESOURCE_URL[type]}${encodeCorePath(path)}`;
    const headers = createHeadersForCreate(Boolean(options.allowOverride || options.etag), options.etag);
    return this.putAction(url, this.withContentId(type, path, body), token, headers);
  }

  /**
   * Core's prompt content schema requires an `id` field equal to the resource's own prefixed
   * path (mirroring the backend's `PromptClientMapper.toPromptDto`, which always computed
   * `id = "prompts/" + folderId + "/" + name` before every write) — toolsets/applications/
   * conversations have no such requirement. Always recomputed from `path`/`type` rather than
   * trusting any `id` already on `body`, since an imported entity's `id` reflects its
   * *original* path, not the destination path being written to.
   */
  private withContentId<T extends object>(type: ResourceType, path: string, body: T): T {
    if (!RESOURCE_TYPES_REQUIRING_CONTENT_ID.has(type)) {
      return body;
    }
    return { ...body, id: `${RESOURCE_TYPE_PREFIX[type]}${path}` };
  }

  /** Deletes a resource (`DELETE /v1/{type}/{path}`), conditionally on `etag` when supplied. */
  delete(token: Token, type: ResourceType, path: string, etag?: string): Promise<ServerActionResponse> {
    const url = `${CORE_RESOURCE_URL[type]}${encodeCorePath(path)}`;
    return this.sendActionRequest(url, 'DELETE', token, undefined, createIfMatchHeaders(etag));
  }

  /**
   * Moves a resource (`POST /v1/ops/resource/move`) — a generic Core "ops" endpoint shared
   * across every resource type (the backend's `ResourceClient.move`), not a per-type
   * `/v1/{type}/{path}` operation. `sourcePath`/`destinationPath` are bare (unprefixed) paths;
   * this method applies the type's prefix and per-segment encoding before sending.
   */
  move(
    token: Token,
    type: ResourceType,
    sourcePath: string,
    destinationPath: string,
    overwrite = false,
  ): Promise<ServerActionResponse> {
    const prefix = RESOURCE_TYPE_PREFIX[type];
    const body = {
      sourceUrl: encodeCorePath(`${prefix}${sourcePath}`),
      destinationUrl: encodeCorePath(`${prefix}${destinationPath}`),
      overwrite,
    };
    return this.postAction(CORE_RESOURCE_MOVE_URL, body, token);
  }

  private resolveListPath(type: ResourceType, path: string): string {
    if (!path && DEFAULT_LIST_PATH_TYPES.has(type)) {
      return DEFAULT_LIST_PATH;
    }
    return path;
  }
}
