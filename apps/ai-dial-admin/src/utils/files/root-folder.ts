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
  ApplicationRoute.AssetsModels,
  ApplicationRoute.AssetsAppRunners,
];

export const isFlatPlatformView = (view?: ApplicationRoute): boolean => !!view && FLAT_PLATFORM_VIEWS.includes(view);

export const getRootFolder = (view: ApplicationRoute): string =>
  isFlatPlatformView(view) ? PLATFORM_ROOT_FOLDER : ROOT_FOLDER;
