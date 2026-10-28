import { ApplicationRoute } from '@/src/types/routes';
import { getGridOptions } from '@/src/components/Common/FileManager/utils';
import { getGridColumns } from '@/src/components/Assets/BaseAssetList/utils';

export const getFilePathGridOptions = (
  t: (key: string, options?: Record<string, string | number> | undefined) => string,
  view?: ApplicationRoute,
) => {
  if (
    view === ApplicationRoute.AssetsApplications ||
    view === ApplicationRoute.AssetsToolsets ||
    view === ApplicationRoute.Prompts
  ) {
    return getGridOptions(view, true, getGridColumns(view), t);
  }
};
