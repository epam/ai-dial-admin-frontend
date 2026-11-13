import { isItemOpenable } from '@/src/components/Common/FileManager/utils';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

export const getAssetItemUrl = (view: ApplicationRoute, item: unknown): string => getUrnForEntity(view, item);

export const getAssetItemHref = (view: ApplicationRoute, item: { name?: string } | undefined): string | undefined =>
  item?.name && isItemOpenable(view, item.name) ? getAssetItemUrl(view, item) : undefined;
