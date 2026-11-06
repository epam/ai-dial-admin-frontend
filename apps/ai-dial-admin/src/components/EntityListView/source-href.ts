import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

export const getEntitySourceHref = (data: unknown): string | undefined => {
  const source = (data as { source?: SOURCE_FIELD } | undefined)?.source;
  if (source?.$type === SOURCE_TYPE.ADAPTER && source.adapterName) {
    return getUrnForEntity(ApplicationRoute.Adapters, { name: source.adapterName });
  }
  if (source?.$type === SOURCE_TYPE.CONTAINER && source.containerId) {
    return getUrnForEntity(ApplicationRoute.Containers, { name: source.containerId });
  }
  return undefined;
};
