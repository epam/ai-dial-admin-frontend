import { ROOT_FOLDER } from '@/src/constants/file';
import { BucketType, EntitySource } from '@/src/models/dial/asset-list-item';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ApplicationRoute } from '@/src/types/routes';

/** Core's fixed bucket for `ConfigResourceController`-backed resource types. */
export const PLATFORM_ROOT_FOLDER = 'platform';

/** A synthetic UI root backed by Core's read-only config-file inspection endpoint. */
export const FILE_ROOT_FOLDER = 'file';

export interface RootDescriptor {
  name: string;
  source: EntitySource;
  isReadOnly: boolean;
}

const resourceRoot = (name: string): RootDescriptor => ({
  name,
  source: EntitySource.Resource,
  isReadOnly: false,
});

const fileRoot = (): RootDescriptor => ({
  name: FILE_ROOT_FOLDER,
  source: EntitySource.File,
  isReadOnly: true,
});

/** Core's flat `platform` resource views. */
const FLAT_PLATFORM_VIEWS: readonly ApplicationRoute[] = [
  ApplicationRoute.PlatformModels,
  ApplicationRoute.PlatformAppRunners,
  ApplicationRoute.PlatformCatalogSchemas,
  ApplicationRoute.PlatformInterceptors,
  ApplicationRoute.PlatformTranslators,
  ApplicationRoute.PlatformRoutes,
  ApplicationRoute.PlatformRoles,
  ApplicationRoute.PlatformKeys,
];

export const isFlatPlatformView = (view?: ApplicationRoute): boolean => !!view && FLAT_PLATFORM_VIEWS.includes(view);

export const getRootFolder = (view: ApplicationRoute): string =>
  isFlatPlatformView(view) ? PLATFORM_ROOT_FOLDER : ROOT_FOLDER;

/** Views whose resources can be read from both physical Core buckets. */
export const DUAL_BUCKET_VIEWS: readonly ApplicationRoute[] = [
  ApplicationRoute.AssetsApplications,
  ApplicationRoute.AssetsToolsets,
];

/**
 * Maps listing routes to Core's config-file entity type. `schemas` is Core's application-type-schema
 * population shown on the App Runners surface, not a separate app-runner configuration collection.
 */
export const CONFIG_FILE_ENTITY_TYPE_BY_VIEW: ReadonlyMap<ApplicationRoute, ConfigFileEntityType> = new Map([
  [ApplicationRoute.PlatformModels, ConfigFileEntityType.Models],
  [ApplicationRoute.PlatformAppRunners, ConfigFileEntityType.Schemas],
  [ApplicationRoute.PlatformCatalogSchemas, ConfigFileEntityType.CatalogSchemas],
  [ApplicationRoute.PlatformInterceptors, ConfigFileEntityType.Interceptors],
  [ApplicationRoute.PlatformTranslators, ConfigFileEntityType.Translators],
  [ApplicationRoute.PlatformRoutes, ConfigFileEntityType.Routes],
  [ApplicationRoute.PlatformRoles, ConfigFileEntityType.Roles],
  [ApplicationRoute.AssetsApplications, ConfigFileEntityType.Applications],
  [ApplicationRoute.AssetsToolsets, ConfigFileEntityType.Toolsets],
]);

export const getConfigFileEntityType = (view: ApplicationRoute): ConfigFileEntityType | undefined =>
  CONFIG_FILE_ENTITY_TYPE_BY_VIEW.get(view);

export const isFileRootPath = (path?: string | null): boolean => path === `${FILE_ROOT_FOLDER}/`;

export const isFileSource = (entitySource?: string, path?: string | null): boolean =>
  entitySource === EntitySource.File || isFileRootPath(path);

/**
 * Ordered FileManager roots. `file` is synthetic and must never be sent to Core's resource metadata
 * endpoint. It remains visible when Catalog disables the physical platform bucket.
 */
export const getRootDescriptors = (view: ApplicationRoute, isPlatformBucketEnabled = true): RootDescriptor[] => {
  const hasFileRoot = getConfigFileEntityType(view) != null;

  if (DUAL_BUCKET_VIEWS.includes(view)) {
    const roots = isPlatformBucketEnabled
      ? [resourceRoot(PLATFORM_ROOT_FOLDER), resourceRoot(ROOT_FOLDER)]
      : [resourceRoot(ROOT_FOLDER)];
    return hasFileRoot ? [fileRoot(), ...roots] : roots;
  }

  const roots = [resourceRoot(getRootFolder(view))];
  return hasFileRoot ? [fileRoot(), ...roots] : roots;
};

export const getRootFolders = (view: ApplicationRoute, isPlatformBucketEnabled = true): string[] =>
  getRootDescriptors(view, isPlatformBucketEnabled).map((root) => root.name);

/** The bucket segment a path/folderId begins with, for views whose resources can live in either. */
export const isPlatformBucketPath = (path?: string | null): boolean =>
  !!path && path.startsWith(`${PLATFORM_ROOT_FOLDER}/`);

/** True when a row belongs to the physical platform bucket. */
export const isPlatformBucketRow = (bucket?: string, fallbackPath?: string | null): boolean =>
  bucket ? bucket === BucketType.Platform : isPlatformBucketPath(fallbackPath);

/** True when `view` is a dual physical-bucket view and the current path is in `platform`. */
export const isPlatformDualBucketView = (view: ApplicationRoute, currentPath?: string): boolean =>
  DUAL_BUCKET_VIEWS.includes(view) && isPlatformBucketPath(currentPath);

/** See platform Applications/Toolsets detail URL contract. */
export const isPlatformBucketDetailRoute = (rawPath?: string): boolean => !rawPath;
