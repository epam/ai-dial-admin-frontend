import { ROOT_FOLDER } from '@/src/constants/file';
import { BucketType } from '@/src/models/dial/asset-list-item';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ApplicationRoute } from '@/src/types/routes';

/** Core's fixed bucket for `ConfigResourceController`-backed resource types. */
export const PLATFORM_ROOT_FOLDER = 'platform';

/** Core's flat `platform` resource views. */
const FLAT_PLATFORM_VIEWS: readonly ApplicationRoute[] = [
  ApplicationRoute.PlatformModels,
  ApplicationRoute.PlatformAppRunners,
  ApplicationRoute.PlatformCatalogSchemas,
  ApplicationRoute.PlatformInterceptors,
  ApplicationRoute.PlatformTranslators,
  ApplicationRoute.PlatformRouters,
  ApplicationRoute.PlatformRoutes,
  ApplicationRoute.PlatformRoles,
  ApplicationRoute.PlatformKeys,
];

export const isFlatPlatformView = (view?: ApplicationRoute): boolean => !!view && FLAT_PLATFORM_VIEWS.includes(view);

/**
 * Core's `platform` resource views that nest exactly one folder level — the policy records, whose
 * folder is the cost object. Same bucket and root as the flat views, but the list shows that folder level,
 * and create/duplicate write `[folder/]name`. Rename, move and a second level are never offered.
 */
const NESTED_PLATFORM_VIEWS: readonly ApplicationRoute[] = [
  ApplicationRoute.PlatformPolicies,
  ApplicationRoute.PlatformPolicyAssignments,
];

export const isNestedPlatformView = (view?: ApplicationRoute): boolean =>
  !!view && NESTED_PLATFORM_VIEWS.includes(view);

/** Whether `view` lives in the physical `platform` bucket, with or without a folder level. */
export const isPlatformBucketView = (view?: ApplicationRoute): boolean =>
  isFlatPlatformView(view) || isNestedPlatformView(view);

export const getRootFolder = (view: ApplicationRoute): string =>
  isPlatformBucketView(view) ? PLATFORM_ROOT_FOLDER : ROOT_FOLDER;

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
  [ApplicationRoute.PlatformRouters, ConfigFileEntityType.Routers],
  [ApplicationRoute.PlatformRoutes, ConfigFileEntityType.Routes],
  [ApplicationRoute.PlatformRoles, ConfigFileEntityType.Roles],
  [ApplicationRoute.AssetsApplications, ConfigFileEntityType.Applications],
  [ApplicationRoute.AssetsToolsets, ConfigFileEntityType.Toolsets],
]);

export const getConfigFileEntityType = (view: ApplicationRoute): ConfigFileEntityType | undefined =>
  CONFIG_FILE_ENTITY_TYPE_BY_VIEW.get(view);

/** The bucket segment a path/folderId begins with, for views whose resources can live in either. */
export const isPlatformBucketPath = (path?: string | null): boolean =>
  !!path && path.startsWith(`${PLATFORM_ROOT_FOLDER}/`);

/** True for the public bucket's root and every folder below it. */
export const isPublicPath = (path?: string | null): boolean => !!path && path.startsWith(`${ROOT_FOLDER}/`);

/** True when a row belongs to the physical platform bucket. */
export const isPlatformBucketRow = (bucket?: string, fallbackPath?: string | null): boolean =>
  bucket ? bucket === BucketType.Platform : isPlatformBucketPath(fallbackPath);

/** See platform Applications/Toolsets detail URL contract. */
export const isPlatformBucketDetailRoute = (rawPath?: string): boolean => !rawPath;
