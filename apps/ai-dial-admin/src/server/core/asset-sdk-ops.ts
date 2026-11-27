import { ResourceType } from '@/src/types/resource-type';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { AssetSdkOps } from './models';

/**
 * Resource types whose `AssetApi` calls go through the SDK. A type without a row still uses the hand-written URL
 * in `assets-core.ts`; each migration adds its row and deletes that type's URL entries.
 *
 * Every closure receives a path that is already encoded with `encodeCorePath` and sends it as given. The bucket of
 * a flat platform type is `PLATFORM_ROOT_FOLDER`; the prefix in `RESOURCE_TYPE_PREFIX` already names it for the URL.
 * The one cast is the request body, which `AssetApi.put` holds as a generic object.
 */
export const ASSET_SDK_OPS: Partial<Record<ResourceType, AssetSdkOps>> = {
  [ResourceType.MODEL]: {
    getContent: (sdk, path, init) => sdk.getModelByPath(PLATFORM_ROOT_FOLDER, path, init),
    getMetadata: (sdk, path, query, init) =>
      sdk.getModelMetadata(PLATFORM_ROOT_FOLDER, path, { ...init, params: { query } }),
    save: (sdk, path, body, init) =>
      sdk.saveModel(PLATFORM_ROOT_FOLDER, path, { ...init, body: body as Record<string, unknown> }),
    delete: (sdk, path, init) => sdk.deleteModel(PLATFORM_ROOT_FOLDER, path, init),
  },
};
