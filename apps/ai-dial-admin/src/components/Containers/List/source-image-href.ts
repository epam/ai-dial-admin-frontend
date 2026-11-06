import { CONTAINER_SOURCE_TYPE, ContainerSource } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

export const getContainerSourceImageHref = (data: unknown): string | undefined => {
  const source = (data as { source?: ContainerSource } | undefined)?.source;
  if (
    source?.$type !== CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE ||
    source.externalRegistryRef ||
    !source.imageDefinitionId
  ) {
    return undefined;
  }
  return getUrnForEntity(ApplicationRoute.Images, { id: source.imageDefinitionId });
};
