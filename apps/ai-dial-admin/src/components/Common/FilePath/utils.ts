import { Asset, AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { DialFileNodeType } from '@epam/ai-dial-ui-kit';
import { getGridOptions } from '@/src/components/Common/FileManager/utils';
import { getGridColumns } from '@/src/components/Assets/BaseAssetList/utils';

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
    const columnDefs = getGridColumns(() => {}, {}, false);
    return getGridOptions(view, true, columnDefs, t);
  }
};
