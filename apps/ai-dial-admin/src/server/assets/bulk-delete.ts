import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { AssetApi } from '@/src/server/core/asset-api';
import { ResourceType } from '@/src/types/resource-type';

/**
 * Fail-fast sequential bulk delete, shared by every versioned asset type (prompts/toolsets/
 * applications/conversations): Core has no real bulk-delete endpoint, so each path is
 * deleted individually, stopping at the first failure.
 */
export const bulkDeleteAssets = async (
  assetApi: AssetApi,
  token: Token,
  type: ResourceType,
  paths: { path: string }[],
): Promise<ServerActionResponse> => {
  for (const { path } of paths) {
    const result = await assetApi.delete(token, type, path);
    if (!result.success) {
      return result;
    }
  }
  return { success: true };
};
