import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { ContainerCreateSource, ContainerCreateSourceOption } from '@/src/components/Containers/List/models';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';

const INTERNAL_IMAGE_LABELS: Partial<Record<CONTAINER_TYPE, ContainersI18nKey>> = {
  [CONTAINER_TYPE.MCP]: ContainersI18nKey.FromInternalMcpImage,
  [CONTAINER_TYPE.ADAPTER]: ContainersI18nKey.FromInternalAdapterImage,
  [CONTAINER_TYPE.APPLICATION]: ContainersI18nKey.FromInternalApplicationImage,
  [CONTAINER_TYPE.INTERCEPTOR]: ContainersI18nKey.FromInternalInterceptorImage,
};

const DOCKER_IMAGE_MODALS: Partial<Record<CONTAINER_TYPE, ModalType>> = {
  [CONTAINER_TYPE.MCP]: ModalType.createMcpDockerImage,
  [CONTAINER_TYPE.ADAPTER]: ModalType.createAdapterDockerImage,
  [CONTAINER_TYPE.APPLICATION]: ModalType.createApplicationDockerImage,
  [CONTAINER_TYPE.INTERCEPTOR]: ModalType.createInterceptorDockerImage,
};

export const getCreateSourceOptions = (
  type: CONTAINER_TYPE,
  t: (key: string) => string,
  isMcpRegistryEnabled: boolean,
): ContainerCreateSourceOption[] => {
  const internalLabel = INTERNAL_IMAGE_LABELS[type];

  return [
    ...(internalLabel ? [{ id: ContainerCreateSource.INTERNAL_IMAGE, name: t(internalLabel) }] : []),
    { id: ContainerCreateSource.DOCKER_IMAGE, name: t(ContainersI18nKey.FromDockerImageReference) },
    ...(type === CONTAINER_TYPE.MCP && isMcpRegistryEnabled
      ? [{ id: ContainerCreateSource.MCP_REGISTRY, name: t(ContainersI18nKey.FromMcpRegistry) }]
      : []),
  ];
};

export const getCreateModalType = (type: CONTAINER_TYPE, source: ContainerCreateSource): ModalType | undefined => {
  switch (source) {
    case ContainerCreateSource.INTERNAL_IMAGE:
      return ModalType.createContainer;
    case ContainerCreateSource.MCP_REGISTRY:
      return ModalType.createMcpRegistry;
    default:
      return DOCKER_IMAGE_MODALS[type];
  }
};
