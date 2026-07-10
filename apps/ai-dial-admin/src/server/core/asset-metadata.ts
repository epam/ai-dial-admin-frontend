import { DialApplicationResource, DialToolsetResource } from '@/src/models/dial/resource';
import { DialConversation } from '@/src/models/dial/conversation';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ResourceType } from '@/src/types/resource-type';
import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { parseEncodedVersionedPath } from '@/src/server/publications/path';

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
  updatedAt?: number;
  author?: string;
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
  updatedAt?: string;
  nodeType?: DialFileNodeType;
}

const toResourceInfo = (metadata: CoreResourceMetadataNode, prefix: string): ResourceInfo => {
  const { path, folderId, name, version } = parseEncodedVersionedPath(metadata.url, prefix);
  return {
    name,
    folderId,
    path,
    version,
    author: metadata.author,
    updatedAt: metadata.updatedAt !== undefined ? String(metadata.updatedAt) : undefined,
    nodeType: metadata.nodeType.toLowerCase() as DialFileNodeType,
  };
};

/** Flattens a (possibly recursive) metadata tree's `ITEM` nodes into list rows. */
export const toResourceInfoList = (node: CoreResourceMetadataNode | null, prefix: string): ResourceInfo[] => {
  if (!node?.items) {
    return [];
  }
  return node.items.map((item) => toResourceInfo(item, prefix));
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

export type AssetMerge = (content: Record<string, unknown>, metadata: CoreResourceMetadataNode) => unknown;

export const ASSET_MERGERS: Partial<Record<ResourceType, AssetMerge>> = {
  [ResourceType.APPLICATION]: mergeApplicationResource,
  [ResourceType.TOOLSET]: mergeToolsetResource,
  [ResourceType.CONVERSATION]: mergeConversation,
  [ResourceType.PROMPT]: mergePrompt,
};
