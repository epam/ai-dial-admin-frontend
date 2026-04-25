import { RadioButtonWithContent, SelectOption } from '@epam/ai-dial-ui-kit';
import {
  IMAGE_BUILDER_TYPE,
  IMAGE_SOURCE_TYPE,
  IMAGE_STATUS,
  IMAGE_TRANSPORT_TYPE,
  IMAGE_TYPE,
} from '@/src/types/deployments/images';
import { Image, ImageSource } from '@/src/models/deployments/images';
import { ContainersI18nKey, ImagesI18nKey, KubEventsI18nKey } from '@/src/constants/i18n';
import { CONTAINER_STATUS, KubEventType } from '@/src/types/deployments/containers';
import { getRouteByType, getTranslatedType } from '@/src/utils/deployments/entity';

export const SOURCE_TYPES = (t: (key: string) => string): SelectOption[] => [
  { label: t(ImagesI18nKey.SourceDocker), value: IMAGE_SOURCE_TYPE.DOCKER },
  { label: t(ImagesI18nKey.SourceCode), value: IMAGE_SOURCE_TYPE.CODE },
];

export const IMAGE_TYPES = (t: (key: string, options?: Record<string, string | number>) => string): SelectOption[] => [
  {
    label: t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(getRouteByType(IMAGE_TYPE.MCP), t) }),
    value: IMAGE_TYPE.MCP,
  },
  {
    label: t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(getRouteByType(IMAGE_TYPE.INTERCEPTOR), t) }),
    value: IMAGE_TYPE.INTERCEPTOR,
  },
  {
    label: t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(getRouteByType(IMAGE_TYPE.ADAPTER), t) }),
    value: IMAGE_TYPE.ADAPTER,
  },
  {
    label: t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(getRouteByType(IMAGE_TYPE.APPLICATION), t) }),
    value: IMAGE_TYPE.APPLICATION,
  },
];

export const TRANSPORT_TYPES = (
  t: (key: string, options?: Record<string, string | number>) => string,
): RadioButtonWithContent[] => [
  { name: t(ImagesI18nKey.ImageTransportLocal), id: IMAGE_TRANSPORT_TYPE.LOCAL },
  { name: t(ImagesI18nKey.ImageTransportRemote), id: IMAGE_TRANSPORT_TYPE.REMOTE },
];

export const BUILDER_TYPES = (
  t: (key: string, options?: Record<string, string | number>) => string,
): RadioButtonWithContent[] => [
  {
    name: t(ImagesI18nKey.BuilderRootless),
    id: IMAGE_BUILDER_TYPE.ROOTLESS,
    caption: t(ImagesI18nKey.BuilderRootlessCaption),
  },
  { name: t(ImagesI18nKey.BuilderRoot), id: IMAGE_BUILDER_TYPE.ROOT, caption: t(ImagesI18nKey.BuilderRootCaption) },
];

export const IMAGE_TRANSPORT_I18N_KEYS: Record<IMAGE_TRANSPORT_TYPE, string> = {
  [IMAGE_TRANSPORT_TYPE.LOCAL]: ImagesI18nKey.ImageTransportLocal,
  [IMAGE_TRANSPORT_TYPE.REMOTE]: ImagesI18nKey.ImageTransportRemote,
};

export const IMAGE_SOURCE_TYPE_I18N_KEYS: Record<IMAGE_SOURCE_TYPE, string> = {
  [IMAGE_SOURCE_TYPE.DOCKER]: ImagesI18nKey.SourceDocker,
  [IMAGE_SOURCE_TYPE.CODE]: ImagesI18nKey.SourceCode,
};

export const IMAGE_TYPE_I18N_KEYS: Record<IMAGE_TYPE, string> = {
  [IMAGE_TYPE.MCP]: ImagesI18nKey.ImageTypeMCP,
  [IMAGE_TYPE.INTERCEPTOR]: ImagesI18nKey.ImageTypeInterceptor,
  [IMAGE_TYPE.ADAPTER]: ImagesI18nKey.ImageTypeAdapter,
  [IMAGE_TYPE.APPLICATION]: ImagesI18nKey.ImageTypeApplication,
};

export const STATUS_I18N_KEYS: Record<IMAGE_STATUS | CONTAINER_STATUS | KubEventType, string> = {
  [IMAGE_STATUS.BUILT]: ImagesI18nKey.Installed,
  [IMAGE_STATUS.BUILDING]: ImagesI18nKey.Installing,
  [IMAGE_STATUS.NOT_BUILT]: ImagesI18nKey.NotInstalled,
  [IMAGE_STATUS.BUILD_FAILED]: ImagesI18nKey.InstallationFailed,
  [IMAGE_STATUS.BUILD_STOPPED]: ImagesI18nKey.BuildStopped,
  [CONTAINER_STATUS.RUNNING]: ContainersI18nKey.Running,
  [CONTAINER_STATUS.PENDING]: ContainersI18nKey.Preparing,
  [CONTAINER_STATUS.NOT_DEPLOYED]: ContainersI18nKey.NotRunning,
  [CONTAINER_STATUS.FAILED]: ContainersI18nKey.Failed,
  [CONTAINER_STATUS.STOPPED]: ContainersI18nKey.Stopped,
  [CONTAINER_STATUS.STOPPING]: ContainersI18nKey.Stopping,
  [KubEventType.NORMAL]: KubEventsI18nKey.Normal,
  [KubEventType.WARNING]: KubEventsI18nKey.Warning,
};

export const STATUS_CLASSNAMES: Record<IMAGE_STATUS | CONTAINER_STATUS | KubEventType, string> = {
  [IMAGE_STATUS.BUILT]: 'bg-accent-secondary',
  [IMAGE_STATUS.BUILDING]: '',
  [IMAGE_STATUS.NOT_BUILT]: 'bg-red-400',
  [IMAGE_STATUS.BUILD_FAILED]: 'bg-red-400',
  [IMAGE_STATUS.BUILD_STOPPED]: 'bg-orange-400',
  [CONTAINER_STATUS.RUNNING]: 'bg-accent-secondary',
  [CONTAINER_STATUS.PENDING]: '',
  [CONTAINER_STATUS.STOPPING]: '',
  [CONTAINER_STATUS.NOT_DEPLOYED]: 'bg-red-400',
  [CONTAINER_STATUS.FAILED]: 'bg-red-400',
  [CONTAINER_STATUS.STOPPED]: 'bg-orange-400',
  [KubEventType.NORMAL]: 'bg-controls-disable',
  [KubEventType.WARNING]: 'bg-red-400',
};

export const LOADING_STATUSES = [CONTAINER_STATUS.PENDING, CONTAINER_STATUS.STOPPING, IMAGE_STATUS.BUILDING];

export const IMAGE_TEMPLATE: Image = {
  id: '',
  $type: IMAGE_TYPE.MCP,
  version: '1.0.0',
  name: '',
  description: '',
  source: {
    $type: IMAGE_SOURCE_TYPE.DOCKER,
    imageUri: '',
  },
  transportType: IMAGE_TRANSPORT_TYPE.LOCAL,
  imageBuilder: IMAGE_BUILDER_TYPE.ROOTLESS,
  topics: [],
  buildStatus: IMAGE_STATUS.NOT_BUILT,
};

export const DEFAULT_IMAGE_SOURCE: ImageSource = {
  $type: IMAGE_SOURCE_TYPE.DOCKER,
  imageUri: '',
};

export const IMAGE_BUILD_POLL_INTERVAL = 5000;
