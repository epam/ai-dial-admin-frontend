import { RESOURCE_TYPE_PREFIX } from '@/src/constants/publications-core';
import { DialFileNodeType } from '@/src/models/dial/file';
import { parseEncodedFolderPath } from '@/src/server/publications/path';
import { ResourceType } from '@/src/types/resource-type';
import { CoreResourceMetadataNode, ResourceInfo } from './asset-metadata';

const toSkillResourceInfo = (metadata: CoreResourceMetadataNode): ResourceInfo => {
  const { path, folderId, name } = parseEncodedFolderPath(metadata.url, RESOURCE_TYPE_PREFIX[ResourceType.SKILL]);
  return {
    name,
    folderId,
    path,
    author: metadata.author,
    createdAt: metadata.createdAt !== undefined ? String(metadata.createdAt) : undefined,
    updatedAt: metadata.updatedAt !== undefined ? String(metadata.updatedAt) : undefined,
    nodeType: metadata.nodeType.toLowerCase() as DialFileNodeType,
    etag: metadata.etag,
  };
};

/**
 * Flattens a Skill folder-listing node's children into list rows. Mirrors `toResourceInfoList` for
 * versioned assets, but doesn't reuse it directly: a skill nests in folders like a versioned type,
 * yet carries no `__version` suffix, so it needs `parseEncodedFolderPath` rather than
 * `parseEncodedVersionedPath` or the single-level `parseEncodedFlatPath` (Model/App Runner) —
 * a mapping shape `toResourceInfo`'s two-way `isVersioned` branch doesn't have.
 */
export const toSkillList = (node: CoreResourceMetadataNode | null): ResourceInfo[] => {
  if (!node?.items) {
    return [];
  }
  return node.items.map(toSkillResourceInfo);
};
