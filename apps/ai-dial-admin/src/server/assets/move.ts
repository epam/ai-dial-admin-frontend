import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { AssetApi } from '@/src/server/core/asset-api';
import { ResourceType } from '@/src/types/resource-type';
import { changePath, extractVersionByPath } from '@/src/utils/files/path';

/**
 * Moves a batch of versioned-asset paths (prompts/toolsets/applications), shared across all
 * three: when `duplicateName` is supplied (the "duplicate" flow, not a plain move), the
 * source's version suffix is reapplied to the new name.
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
      const version = extractVersionByPath(path);
      const newName = version ? `${duplicateName}__${version}` : duplicateName;
      destinationPath = changePath(path, newPath, newName);
    } else {
      destinationPath = changePath(path, newPath);
    }
    return assetApi.move(token, type, path, destinationPath, overwrite);
  });
  return Promise.all(requests);
};
