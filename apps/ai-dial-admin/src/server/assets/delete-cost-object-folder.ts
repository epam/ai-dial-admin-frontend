import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { AssetApi } from '@/src/server/core/asset-api';
import { ResourceType } from '@/src/types/resource-type';
import { getCostObjectFolderPath } from '@/src/utils/policies/path';
import { getItemPaths } from '@/src/utils/policies/rows';

/**
 * Deletes a cost object "folder" of policy records. Core has no folder delete for them: a folder exists
 * only while it holds a record, so removing the folder means removing every record under it, after which
 * it disappears. Core lists a folder only when its path ends with a slash — `team-a/`, never `team-a` — so
 * the path is normalised first. The root (a global policy's level) is refused, since it is not a folder.
 */
export const deleteCostObjectFolder = async (
  assetApi: AssetApi,
  token: Token,
  type: ResourceType,
  folderPath: string,
): Promise<ServerActionResponse> => {
  const folder = getCostObjectFolderPath(folderPath);
  if (!folder) {
    return {
      success: false,
      errorHeader: 'Bad Request',
      errorMessage: 'Only a cost object folder can be deleted, not the root.',
    };
  }

  const rows = await assetApi.list(token, type, folder);
  return bulkDeleteAssets(
    assetApi,
    token,
    type,
    getItemPaths(rows).map((path) => ({ path })),
  );
};
