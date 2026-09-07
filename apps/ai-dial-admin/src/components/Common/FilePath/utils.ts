import { Asset, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { DialFileNodeType } from '@epam/ai-dial-ui-kit';
import { getGridOptions } from '@/src/components/Common/FileManager/utils';
import { getGridColumns } from '@/src/components/Assets/BaseAssetList/utils';
import { DUAL_BUCKET_VIEWS, isPlatformBucketPath } from '@/src/utils/files/root-folder';

/**
 * The Move-to popup only ever offers `public` destinations (the `platform` bucket is flat, see
 * `platform-applications`/`platform-toolsets`), so its source tree drops the `platform` root that
 * `AssetsFolderContext.files` otherwise carries for `DUAL_BUCKET_VIEWS`. Views outside that set never
 * have a `platform` root in `files` to begin with, so this is a no-op for them.
 */
export const excludePlatformRoot = (
  files: (Asset | AssetWithVersion)[] = [],
  view?: ApplicationRoute,
): (Asset | AssetWithVersion)[] => {
  if (!view || !DUAL_BUCKET_VIEWS.includes(view)) {
    return files;
  }
  return files.filter((file) => !isPlatformBucketPath(file.path));
};

export const processAssetsData = (
  assets: (Asset | AssetWithVersion)[] = [],
  view?: ApplicationRoute,
): (Asset | AssetWithVersion)[] => {
  if (
    view !== ApplicationRoute.AssetsApplications &&
    view !== ApplicationRoute.AssetsToolsets &&
    view !== ApplicationRoute.Prompts
  ) {
    return assets;
  }

  const processedAssets = assets.map((asset) => {
    if (asset.nodeType === DialFileNodeType.FOLDER && asset.items) {
      return { ...asset, items: processAssetsData(asset.items, view) };
    }
    return asset;
  });

  return (processedAssets as AssetWithVersion[]).reduce((acc: AssetWithVersion[], curr) => {
    if (curr.nodeType === DialFileNodeType.ITEM) {
      curr.selectedVersions = [curr.version];
      const existing = acc.find((a) => a.nodeType === DialFileNodeType.ITEM && a.name === curr.name);
      if (existing) {
        existing.path = curr.path;
        existing.version = curr.version;
        existing.selectedVersions = [curr.version];
        if (!existing.versions) existing.versions = [];
        if (!existing.versions.includes(curr.version)) {
          existing.versions.push(curr.version);
        }
      } else {
        acc.push({ ...curr, versions: [curr.version] });
      }
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);
};

export const getFilePathGridOptions = (
  t: (key: string, options?: Record<string, string | number> | undefined) => string,
  view?: ApplicationRoute,
) => {
  if (
    view === ApplicationRoute.AssetsApplications ||
    view === ApplicationRoute.AssetsToolsets ||
    view === ApplicationRoute.Prompts
  ) {
    const columnDefs = getGridColumns(view, () => {}, {}, false);
    return getGridOptions(view, true, columnDefs, t);
  }
};
