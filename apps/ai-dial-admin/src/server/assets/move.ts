import { FOLDER_NESTED_VERSIONLESS_TYPES } from '@/src/constants/assets-core';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { AssetApi } from '@/src/server/core/asset-api';
import { ResourceType } from '@/src/types/resource-type';
import { extractNameAndVersion } from '@/src/server/publications/path';
import { changePath } from '@/src/utils/files/path';

/**
 * Moves a batch of asset paths (prompts/toolsets/applications/skills), shared across all
 * four. When `duplicateName` is supplied (the "duplicate" flow, not a plain move), the
 * versioned types (application/toolset) reapply the source's `__version` suffix to the new
 * name; folder-nested versionless types (prompt/conversation) use `duplicateName` verbatim —
 * a `__` in their path is part of the name, never a version suffix.
 */
export const moveAssets = (
  assetApi: AssetApi,
  token: Token,
  type: ResourceType,
  paths: string[],
  newPath: string,
  overwrite?: boolean,
  duplicateName?: string,
): Promise<ServerActionResponse[]> => {
  const requests = paths.map((path) => {
    let destinationPath = '';
    if (duplicateName) {
      const sourceLeaf = path.slice(path.lastIndexOf('/') + 1);
      const version = FOLDER_NESTED_VERSIONLESS_TYPES.has(type) ? undefined : extractNameAndVersion(sourceLeaf).version;
      const newName = version == null ? duplicateName : `${duplicateName}__${version}`;
      destinationPath = changePath(path, newPath, newName);
    } else {
      destinationPath = changePath(path, newPath);
    }
    return assetApi.move(token, type, path, destinationPath, overwrite);
  });
  return Promise.all(requests);
};
