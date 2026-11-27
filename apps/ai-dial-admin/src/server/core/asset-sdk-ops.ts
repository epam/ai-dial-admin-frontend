import { ResourceType } from '@/src/types/resource-type';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { AssetSdkOps, SdkApplicationTypeSchema, SdkCatalogSchema } from './models';

/**
 * Resource types whose `AssetApi` calls go through the SDK. A type without a row still uses the hand-written URL
 * in `assets-core.ts`; each migration adds its row and deletes that type's URL entries.
 *
 * Every closure receives a path that is already encoded with `encodeCorePath` and sends it as given. The bucket of
 * a flat platform type is `PLATFORM_ROOT_FOLDER`; the prefix in `RESOURCE_TYPE_PREFIX` already names it for the URL.
 * The one cast is the request body, which `AssetApi.put` holds as a generic object (to the SDK's own schema type for the
 * two schema saves, whose operations require a `$id`).
 *
 * `ROUTER` uses `getPlatformRouter` (`/v1/routers/{bucket}/{path}`), not `getRouter`, which is the name-only
 * `/v1/routers/{router_name}`.
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
  [ResourceType.ROUTER]: {
    getContent: (sdk, path, init) => sdk.getPlatformRouter(PLATFORM_ROOT_FOLDER, path, init),
    getMetadata: (sdk, path, query, init) =>
      sdk.getRouterMetadata(PLATFORM_ROOT_FOLDER, path, { ...init, params: { query } }),
    save: (sdk, path, body, init) =>
      sdk.savePlatformRouter(PLATFORM_ROOT_FOLDER, path, { ...init, body: body as Record<string, unknown> }),
    delete: (sdk, path, init) => sdk.deletePlatformRouter(PLATFORM_ROOT_FOLDER, path, init),
  },
  [ResourceType.ROLE]: {
    getContent: (sdk, path, init) => sdk.getRole(PLATFORM_ROOT_FOLDER, path, init),
    getMetadata: (sdk, path, query, init) =>
      sdk.getRoleMetadata(PLATFORM_ROOT_FOLDER, path, { ...init, params: { query } }),
    save: (sdk, path, body, init) =>
      sdk.saveRole(PLATFORM_ROOT_FOLDER, path, { ...init, body: body as Record<string, unknown> }),
    delete: (sdk, path, init) => sdk.deleteRole(PLATFORM_ROOT_FOLDER, path, init),
  },
  [ResourceType.ROUTE]: {
    getContent: (sdk, path, init) => sdk.getRoute(PLATFORM_ROOT_FOLDER, path, init),
    getMetadata: (sdk, path, query, init) =>
      sdk.getRouteMetadata(PLATFORM_ROOT_FOLDER, path, { ...init, params: { query } }),
    save: (sdk, path, body, init) =>
      sdk.saveRoute(PLATFORM_ROOT_FOLDER, path, { ...init, body: body as Record<string, unknown> }),
    delete: (sdk, path, init) => sdk.deleteRoute(PLATFORM_ROOT_FOLDER, path, init),
  },
  [ResourceType.PROJECT_KEY]: {
    getContent: (sdk, path, init) => sdk.getKey(PLATFORM_ROOT_FOLDER, path, init),
    getMetadata: (sdk, path, query, init) =>
      sdk.getKeyMetadata(PLATFORM_ROOT_FOLDER, path, { ...init, params: { query } }),
    save: (sdk, path, body, init) =>
      sdk.saveKey(PLATFORM_ROOT_FOLDER, path, { ...init, body: body as Record<string, unknown> }),
    delete: (sdk, path, init) => sdk.deleteKey(PLATFORM_ROOT_FOLDER, path, init),
  },
  [ResourceType.INTERCEPTOR]: {
    getContent: (sdk, path, init) => sdk.getInterceptor(PLATFORM_ROOT_FOLDER, path, init),
    getMetadata: (sdk, path, query, init) =>
      sdk.getInterceptorMetadata(PLATFORM_ROOT_FOLDER, path, { ...init, params: { query } }),
    save: (sdk, path, body, init) =>
      sdk.saveInterceptor(PLATFORM_ROOT_FOLDER, path, { ...init, body: body as Record<string, unknown> }),
    delete: (sdk, path, init) => sdk.deleteInterceptor(PLATFORM_ROOT_FOLDER, path, init),
  },
  [ResourceType.TRANSLATOR]: {
    getContent: (sdk, path, init) => sdk.getTranslator(PLATFORM_ROOT_FOLDER, path, init),
    getMetadata: (sdk, path, query, init) =>
      sdk.getTranslatorMetadata(PLATFORM_ROOT_FOLDER, path, { ...init, params: { query } }),
    save: (sdk, path, body, init) =>
      sdk.saveTranslator(PLATFORM_ROOT_FOLDER, path, { ...init, body: body as Record<string, unknown> }),
    delete: (sdk, path, init) => sdk.deleteTranslator(PLATFORM_ROOT_FOLDER, path, init),
  },
  [ResourceType.PLUGIN]: {
    getContent: (sdk, path, init) => sdk.getPlugin(PLATFORM_ROOT_FOLDER, path, init),
    getMetadata: (sdk, path, query, init) =>
      sdk.getPluginMetadata(PLATFORM_ROOT_FOLDER, path, { ...init, params: { query } }),
    save: (sdk, path, body, init) =>
      sdk.savePlugin(PLATFORM_ROOT_FOLDER, path, { ...init, body: body as Record<string, unknown> }),
    delete: (sdk, path, init) => sdk.deletePlugin(PLATFORM_ROOT_FOLDER, path, init),
  },
  [ResourceType.APP_TYPE_SCHEMA]: {
    getContent: (sdk, path, init) => sdk.getSchema(PLATFORM_ROOT_FOLDER, path, init),
    getMetadata: (sdk, path, query, init) =>
      sdk.getSchemaMetadata(PLATFORM_ROOT_FOLDER, path, { ...init, params: { query } }),
    save: (sdk, path, body, init) =>
      sdk.saveSchema(PLATFORM_ROOT_FOLDER, path, { ...init, body: body as SdkApplicationTypeSchema }),
    delete: (sdk, path, init) => sdk.deleteSchema(PLATFORM_ROOT_FOLDER, path, init),
  },
  [ResourceType.CATALOG_SCHEMA]: {
    getContent: (sdk, path, init) => sdk.getCatalogSchemaResource(PLATFORM_ROOT_FOLDER, path, init),
    getMetadata: (sdk, path, query, init) =>
      sdk.getCatalogSchemaMetadata(PLATFORM_ROOT_FOLDER, path, { ...init, params: { query } }),
    save: (sdk, path, body, init) =>
      sdk.saveCatalogSchemaResource(PLATFORM_ROOT_FOLDER, path, { ...init, body: body as SdkCatalogSchema }),
    delete: (sdk, path, init) => sdk.deleteCatalogSchemaResource(PLATFORM_ROOT_FOLDER, path, init),
  },
};
