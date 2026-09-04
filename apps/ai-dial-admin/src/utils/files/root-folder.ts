import { ROOT_FOLDER } from '@/src/constants/file';
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
  ApplicationRoute.PlatformInterceptors,
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
 * can fetch/order them without special-casing the view itself.
 */
export const getRootFolders = (view: ApplicationRoute): string[] =>
  DUAL_BUCKET_VIEWS.includes(view) ? [PLATFORM_ROOT_FOLDER, ROOT_FOLDER] : [getRootFolder(view)];

/** The bucket segment a path/folderId begins with, for views whose resources can live in either. */
export const isPlatformBucketPath = (path?: string | null): boolean =>
  !!path && path.startsWith(`${PLATFORM_ROOT_FOLDER}/`);

/**
 * True when `view` is one of `DUAL_BUCKET_VIEWS` *and* the current path is inside its `platform`
 * bucket. The dual-bucket grid never shows platform rows and public rows at the same time — browsing
 * into `platform/` renders only the flat platform row set, browsing into `public/...` renders the
 * foldered tree — so "which bucket" is a property of the current path being browsed, not a per-row
 * concern (design.md D2, `platform-applications`/`platform-toolsets`).
 */
export const isPlatformDualBucketView = (view: ApplicationRoute, currentPath?: string): boolean =>
  DUAL_BUCKET_VIEWS.includes(view) && isPlatformBucketPath(currentPath);
