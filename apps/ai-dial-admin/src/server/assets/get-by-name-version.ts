import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { AssetApi } from '@/src/server/core/asset-api';
import { ResourceType } from '@/src/types/resource-type';

/**
 * Resolves a versioned asset's (prompts/toolsets/applications) storage path by listing its
 * folder and matching on `name` and `version`, then fetches that resolved path via the
 * shared Core asset client's conditional GET.
 */
export const getAssetByNameVersion = async <T extends object>(
  assetApi: AssetApi,
  token: Token,
  type: ResourceType,
  folderId: string,
  name: string,
  version: string,
  etag: string,
): Promise<ServerActionResponse<T>> => {
  const items = await assetApi.list(token, type, `${folderId}/`);
  const path = items.find((item) => item.name === name && item.version === version)?.path;
  if (!path) {
    return { success: false, errorHeader: 'Not Found', errorMessage: 'Resource not found' };
  }
  return assetApi.getMergedWithEtag<T>(token, type, path, etag);
};
