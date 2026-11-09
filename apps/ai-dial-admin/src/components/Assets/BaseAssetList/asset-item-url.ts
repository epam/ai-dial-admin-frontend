import { isItemOpenable } from '@/src/components/Common/FileManager/utils';
import { ApplicationRoute } from '@/src/types/routes';
import { isFileRootPath } from '@/src/utils/files/root-folder';
import { appendUrlQuery, getUrnForEntity } from '@/src/utils/open-in-new-tab';

export const getAssetItemUrl = (view: ApplicationRoute, item: unknown, currentPath?: string): string => {
  const url = getUrnForEntity(view, item);
  return isFileRootPath(currentPath) && view !== ApplicationRoute.PlatformCatalogSchemas
    ? appendUrlQuery(url, 'configFile=true')
    : url;
};

export const getAssetItemHref = (
  view: ApplicationRoute,
  item: { name?: string } | undefined,
  currentPath?: string,
): string | undefined =>
  item?.name && isItemOpenable(view, item.name) ? getAssetItemUrl(view, item, currentPath) : undefined;
