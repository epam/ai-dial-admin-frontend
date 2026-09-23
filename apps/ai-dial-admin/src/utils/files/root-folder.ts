import { ROOT_FOLDER } from '@/src/constants/file';
import { BucketType } from '@/src/models/dial/asset-list-item';
import { ApplicationRoute } from '@/src/types/routes';

/** Core's fixed bucket for `ConfigResourceController`-backed resource types. */
export const PLATFORM_ROOT_FOLDER = 'platform';

/**
 * Views whose resources DIAL Core stores in the single fixed `platform` bucket. Core has no folder
 * concept for these, so the tree holds only the root and every folder action is inapplicable — a
 * folder create submits a placeholder asset Core cannot store, and fails without any user-visible
 * signal. Consumers gate folder affordances on `isFlatPlatformView`.
 */
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

/**
 * Views whose resources DIAL Core stores in *both* buckets — a flat `platform` set (config-managed,
 * same as `FLAT_PLATFORM_VIEWS`) and the hierarchical, versioned `public` tree: Applications and
 * Toolsets (see `platform-applications`/`platform-toolsets` capabilities). Kept as its own small,
 * explicit set rather than inferred from anything else, so a third dual-bucket entity is a one-line
 * addition here and nowhere else.
 */
export const DUAL_BUCKET_VIEWS: readonly ApplicationRoute[] = [
  ApplicationRoute.AssetsApplications,
  ApplicationRoute.AssetsToolsets,
];

/**
 * Every other view has exactly one root; this returns that view's single root as a one-element
 * array, and for a `DUAL_BUCKET_VIEWS` member returns both roots with `platform` first, so a caller
 * can fetch/order them without special-casing the view itself. `isPlatformBucketEnabled` is `false`
 * when the Catalog menu group is disabled (`DISABLE_MENU_ITEMS` contains `catalog`, surfaced as
 * `featureFlags.catalogEnabled`): the deployment has no reachable platform surface, so a dual-bucket
 * view degrades to its `public` root alone — the same one-element array every other view gets.
 */
export const getRootFolders = (view: ApplicationRoute, isPlatformBucketEnabled = true): string[] =>
  DUAL_BUCKET_VIEWS.includes(view) && isPlatformBucketEnabled
    ? [PLATFORM_ROOT_FOLDER, ROOT_FOLDER]
    : [getRootFolder(view)];

/** The bucket segment a path/folderId begins with, for views whose resources can live in either. */
export const isPlatformBucketPath = (path?: string | null): boolean =>
  !!path && path.startsWith(`${PLATFORM_ROOT_FOLDER}/`);

/**
 * True when a *row* belongs to the platform bucket. Prefers the row's own `bucket` (set once, by the
 * server row mapper — see `asset-list-item.ts`) over parsing a path, per design.md D3. Falls back to
 * `isPlatformBucketPath(fallbackPath)` only for rows that predate that field: client-synthesized
 * folder nodes (the dual-bucket tree roots, `mergeFiles`'s synthesized root, `setTempFolder`
 * placeholders — see `AssetsFolderContext.tsx`) and merged detail entities, which carry bucket only
 * implicitly in `_metadata.folderId`/`path`.
 */
export const isPlatformBucketRow = (bucket?: string, fallbackPath?: string | null): boolean =>
  bucket ? bucket === BucketType.Platform : isPlatformBucketPath(fallbackPath);

/**
 * True when `view` is one of `DUAL_BUCKET_VIEWS` *and* the current path is inside its `platform`
 * bucket. The dual-bucket grid never shows platform rows and public rows at the same time — browsing
 * into `platform/` renders only the flat platform row set, browsing into `public/...` renders the
 * foldered tree — so "which bucket" is a property of the current path being browsed, not a per-row
 * concern (design.md D2, `platform-applications`/`platform-toolsets`).
 */
export const isPlatformDualBucketView = (view: ApplicationRoute, currentPath?: string): boolean =>
  DUAL_BUCKET_VIEWS.includes(view) && isPlatformBucketPath(currentPath);

/**
 * The `AssetsApplications`/`AssetsToolsets` detail routes' URL contract: a `?path=` query param means
 * the resource is public-bucket (versioned, folder-nested); its absence means platform-bucket (flat,
 * identified by the `[id]` segment alone) — design.md D3/D5 of `platform-applications`/
 * `platform-toolsets`. Stated once here so both detail pages read the same inversion instead of each
 * repeating `!rawPath`.
 */
export const isPlatformBucketDetailRoute = (rawPath?: string): boolean => !rawPath;
