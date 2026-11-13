import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';
import { getConfigFileEntityType } from '@/src/utils/files/root-folder';

/** The listings that also hold a hierarchical `public/` tree beside their flat sources. */
const PUBLIC_SOURCE_VIEWS: readonly ApplicationRoute[] = [
  ApplicationRoute.AssetsApplications,
  ApplicationRoute.AssetsToolsets,
];

export interface AssetSourceCounts {
  [AssetSource.Platform]?: number;
  [AssetSource.ConfigFile]?: number;
}

export const hasPublicSource = (view: ApplicationRoute): boolean => PUBLIC_SOURCE_VIEWS.includes(view);

/**
 * The tabs a listing offers, in display order. Platform and config.json are admin-only, so a caller in unit
 * mode keeps only what their units can reach: the public tree for Applications and Toolsets.
 */
export const getAvailableSources = (view: ApplicationRoute, isUnitMode: boolean): AssetSource[] => {
  if (hasPublicSource(view)) {
    return isUnitMode ? [AssetSource.Public] : [AssetSource.Public, AssetSource.Platform, AssetSource.ConfigFile];
  }

  const hasConfigFile = !isUnitMode && getConfigFileEntityType(view) != null;
  return hasConfigFile ? [AssetSource.Platform, AssetSource.ConfigFile] : [AssetSource.Platform];
};

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
 * The count shown after the title. Public is a tree and is not counted, so a listing that has one shows no
 * count; otherwise it is the sum of its flat sources, and a source whose read failed (no count) withholds it
 * rather than showing a partial total.
 */
export const getHeaderCount = (sources: readonly AssetSource[], counts: AssetSourceCounts): number | undefined => {
  if (sources.includes(AssetSource.Public)) {
    return undefined;
  }

  const flatSources = sources.filter(
    (source): source is AssetSource.Platform | AssetSource.ConfigFile => source !== AssetSource.Public,
  );
  const values = flatSources.map((source) => counts[source]);
  if (values.some((value) => value == null)) {
    return undefined;
  }

  return (values as number[]).reduce((sum, value) => sum + value, 0);
};
