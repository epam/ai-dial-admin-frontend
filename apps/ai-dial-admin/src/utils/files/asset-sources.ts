import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';
import { getConfigFileEntityType } from '@/src/utils/files/root-folder';

/** The listings that also hold a hierarchical `public/` tree beside their flat sources. */
const PUBLIC_TREE_VIEWS: readonly ApplicationRoute[] = [
  ApplicationRoute.AssetsApplications,
  ApplicationRoute.AssetsToolsets,
];

/** The listings whose Public source is flat, like their Platform one: Core allows no folders under `aliases/public/`. */
const FLAT_PUBLIC_VIEWS: readonly ApplicationRoute[] = [ApplicationRoute.AssetsAliases];

export interface AssetSourceCounts {
  [AssetSource.Public]?: number;
  [AssetSource.Platform]?: number;
  [AssetSource.ConfigFile]?: number;
}

export const hasPublicTree = (view: ApplicationRoute): boolean => PUBLIC_TREE_VIEWS.includes(view);

export const hasFlatPublic = (view: ApplicationRoute): boolean => FLAT_PUBLIC_VIEWS.includes(view);

/** Whether the listing has a Public tab at all, as a tree or as a flat grid. */
export const hasPublicSource = (view: ApplicationRoute): boolean => hasPublicTree(view) || hasFlatPublic(view);

/**
 * The tabs a listing offers, in display order. Platform and config.json are admin-only, so a caller in unit
 * mode keeps only the Public source, where the listing has one.
 */
export const getAvailableSources = (view: ApplicationRoute, isUnitMode: boolean): AssetSource[] => {
  if (hasPublicSource(view)) {
    return isUnitMode ? [AssetSource.Public] : [AssetSource.Public, AssetSource.Platform, AssetSource.ConfigFile];
  }

  const hasConfigFile = !isUnitMode && getConfigFileEntityType(view) != null;
  return hasConfigFile ? [AssetSource.Platform, AssetSource.ConfigFile] : [AssetSource.Platform];
};

/** Public wherever the listing has a Public source, Platform elsewhere. */
export const getDefaultSource = (view: ApplicationRoute): AssetSource =>
  hasPublicSource(view) ? AssetSource.Public : AssetSource.Platform;

/** An unknown or unavailable `tab` value falls back to the view's default. */
export const parseSourceParam = (
  view: ApplicationRoute,
  raw: string | null | undefined,
  sources: readonly AssetSource[],
): AssetSource => {
  const source = sources.find((candidate) => candidate === raw);
  if (source) {
    return source;
  }

  const defaultSource = getDefaultSource(view);
  return sources.includes(defaultSource) ? defaultSource : sources[0];
};

/**
 * The count shown after the title. A public tree is not counted, so a listing that has one shows no count;
 * otherwise it is the sum of the listing's sources, and a source whose read failed (no count) withholds it
 * rather than showing a partial total.
 */
export const getHeaderCount = (
  view: ApplicationRoute,
  sources: readonly AssetSource[],
  counts: AssetSourceCounts,
): number | undefined => {
  if (hasPublicTree(view)) {
    return undefined;
  }

  const values = sources.map((source) => counts[source]);
  if (values.some((value) => value == null)) {
    return undefined;
  }

  return (values as number[]).reduce((sum, value) => sum + value, 0);
};
