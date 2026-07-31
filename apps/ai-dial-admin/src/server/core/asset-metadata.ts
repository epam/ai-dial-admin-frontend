import {
  DialAppRunnerResource,
  DialApplicationResource,
  DialModelResource,
  DialToolsetResource,
} from '@/src/models/dial/resource';
import { DialConversation } from '@/src/models/dial/conversation';
import { CoreAppRunnerRoutes } from '@/src/models/dial/core-app-runner-route';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { fromCoreAppRoutes } from '@/src/utils/app-runners/core-app-routes';
import { fromCoreRunnerName } from '@/src/utils/app-runners/core-runner-name';
import { ResourceType } from '@/src/types/resource-type';
import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { VERSIONED_RESOURCE_TYPES } from '@/src/constants/assets-core';
import { parseEncodedFlatPath, parseEncodedVersionedPath, VersionedPathParts } from '@/src/server/publications/path';

/**
 * DIAL Core's generic resource metadata node (`GET /v1/metadata/{type}/{path}`).
 * Mirrors the shape the backend's `BaseMetadataDto`/`*ClientMapper` classes consume —
 * the same fields already surfaced to the frontend for files via `DialFile`.
 */
export interface CoreResourceMetadataNode {
  name: string;
  parentPath: string | null;
  bucket: string;
  url: string;
  nodeType: 'ITEM' | 'FOLDER';
  resourceType?: string;
  createdAt?: number;
  updatedAt?: number;
  author?: string;
  /**
   * Present on `ITEM` nodes only (Core's `ResourceItemMetadata`). For flat/unversioned types
   * (e.g. `MODEL`), this is the only place the blob etag is exposed — the per-entity content GET
   * never sets an `ETag` response header, so callers must read it from here instead.
   */
  etag?: string;
  items?: CoreResourceMetadataNode[];
  nextToken?: string;
}

/** Lightweight fields every list row needs — metadata-only, no content fetch (matches the backend's `*Info` list mappers). */
export interface ResourceInfo {
  name: string;
  folderId: string;
  path: string;
  version?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  nodeType?: DialFileNodeType;
}

export const isVersioned = (type: ResourceType): boolean => (VERSIONED_RESOURCE_TYPES as ResourceType[]).includes(type);

const toResourceInfo = (metadata: CoreResourceMetadataNode, type: ResourceType): ResourceInfo => {
  const prefix = RESOURCE_TYPE_PREFIX[type];
  const { path, folderId, name, version }: VersionedPathParts = isVersioned(type)
    ? parseEncodedVersionedPath(metadata.url, prefix)
    : { ...parseEncodedFlatPath(metadata.url, prefix), version: undefined };
  return {
    // An app runner's resource name is its percent-encoded `$id`; rows show the `$id` while `path`
    // stays encoded, since that is what the CRUD calls address.
    name: type === ResourceType.APP_TYPE_SCHEMA ? fromCoreRunnerName(name) : name,
    folderId,
    path,
    version,
    author: metadata.author,
    createdAt: metadata.createdAt !== undefined ? String(metadata.createdAt) : undefined,
    updatedAt: metadata.updatedAt !== undefined ? String(metadata.updatedAt) : undefined,
    nodeType: metadata.nodeType.toLowerCase() as DialFileNodeType,
  };
};

/** Flattens a (possibly recursive) metadata tree's `ITEM` nodes into list rows. */
export const toResourceInfoList = (node: CoreResourceMetadataNode | null, type: ResourceType): ResourceInfo[] => {
  if (!node?.items) {
    return [];
  }
  return node.items.map((item) => toResourceInfo(item, type));
};

const metadataFields = (metadata: CoreResourceMetadataNode, prefix: string) => {
  const { path, folderId, name, version } = parseEncodedVersionedPath(metadata.url, prefix);
  return {
    name,
    folderId,
    path,
    version: version ?? '',
    author: metadata.author ?? '',
    updatedAt: metadata.updatedAt !== undefined ? String(metadata.updatedAt) : undefined,
  };
};

const flatMetadataFields = (metadata: CoreResourceMetadataNode, prefix: string) => {
  const { path, folderId, name } = parseEncodedFlatPath(metadata.url, prefix);
  return {
    name,
    path,
    folderId,
    author: metadata.author ?? '',
    createdAt: metadata.createdAt !== undefined ? String(metadata.createdAt) : undefined,
    updatedAt: metadata.updatedAt !== undefined ? String(metadata.updatedAt) : undefined,
  };
};

/**
 * Merges a Core content DTO with its Core metadata node into the frontend model shape,
 * matching the backend's `*ClientMapper` field split: name/folderId/version/author/updatedAt
 * come from metadata, everything else comes from content.
 */
export const mergeApplicationResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialApplicationResource => {
  return {
    ...content,
    ...metadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.APPLICATION]),
  } as DialApplicationResource;
};

export const mergeToolsetResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialToolsetResource => {
  return {
    ...content,
    ...metadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.TOOLSET]),
  } as DialToolsetResource;
};

export const mergeConversation = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialConversation => {
  return {
    ...content,
    ...metadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.CONVERSATION]),
  } as DialConversation;
};

export const mergePrompt = (content: Record<string, unknown>, metadata: CoreResourceMetadataNode): DialPrompt => {
  return {
    ...content,
    ...metadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.PROMPT]),
    nodeType: DialFileNodeType.ITEM,
  } as DialPrompt;
};

/**
 * Models are flat and unversioned (Core's `models/platform/{name}`, no subfolders, no
 * `__version` suffix) — merged via `flatMetadataFields` rather than `metadataFields`, since the
 * metadata `url`'s remainder after stripping the `models/platform/` prefix is a bare name with
 * no `/` separator to split into folderId + name.
 */
export const mergeModelResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialModelResource => {
  return {
    ...content,
    ...flatMetadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.MODEL]),
  } as DialModelResource;
};

/**
 * App runners are flat and unversioned like models, and additionally carry two conversions no other
 * type needs: the resource name is a percent-encoded `$id` (recovered here, since `$id` is the
 * runner's identity everywhere in the UI), and Core's `dial:applicationTypeRoutes` is a name-keyed
 * object that the route editors consume as an array.
 */
export const mergeAppRunnerResource = (
  content: Record<string, unknown>,
  metadata: CoreResourceMetadataNode,
): DialAppRunnerResource => {
  const { name, ...fields } = flatMetadataFields(metadata, RESOURCE_TYPE_PREFIX[ResourceType.APP_TYPE_SCHEMA]);
  const routes = fromCoreAppRoutes(content['dial:applicationTypeRoutes'] as CoreAppRunnerRoutes | undefined);
  return {
    ...content,
    ...fields,
    name,
    $id: fromCoreRunnerName(name),
    ...(routes && { 'dial:applicationTypeRoutes': routes }),
  } as DialAppRunnerResource;
};

export type AssetMerge = (content: Record<string, unknown>, metadata: CoreResourceMetadataNode) => unknown;

export const ASSET_MERGERS: Partial<Record<ResourceType, AssetMerge>> = {
  [ResourceType.APPLICATION]: mergeApplicationResource,
  [ResourceType.TOOLSET]: mergeToolsetResource,
  [ResourceType.CONVERSATION]: mergeConversation,
  [ResourceType.PROMPT]: mergePrompt,
  [ResourceType.MODEL]: mergeModelResource,
  [ResourceType.APP_TYPE_SCHEMA]: mergeAppRunnerResource,
};
