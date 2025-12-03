import { SelectOption } from '@epam/ai-dial-ui-kit';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { Image } from '@/src/models/deployments/images';
import { ContainersI18nKey, ImagesI18nKey, KubEventsI18nKey } from '@/src/constants/i18n';
import { CONTAINER_STATUS, KubEventType } from '@/src/types/deployments/containers';

export const SOURCES: SelectOption[] = [
  { label: ImagesI18nKey.SourceDocker, value: IMAGE_SOURCE_TYPE.DOCKER },
  { label: ImagesI18nKey.SourceCode, value: IMAGE_SOURCE_TYPE.CODE },
];

export const TRANSPORT_TYPES: { id: IMAGE_TRANSPORT_TYPE; name: string }[] = [
  { name: 'Local (STDIO)', id: IMAGE_TRANSPORT_TYPE.LOCAL },
  { name: 'Remote (HTTP/SSE)', id: IMAGE_TRANSPORT_TYPE.REMOTE },
];

export const STATUS_I18N_KEYS: Record<IMAGE_STATUS | CONTAINER_STATUS | KubEventType, string> = {
  [IMAGE_STATUS.BUILT]: ImagesI18nKey.Installed,
  [IMAGE_STATUS.BUILDING]: ImagesI18nKey.Installing,
  [IMAGE_STATUS.NOT_BUILT]: ImagesI18nKey.NotInstalled,
  [IMAGE_STATUS.BUILD_FAILED]: ImagesI18nKey.InstallationFailed,
  [CONTAINER_STATUS.RUNNING]: ContainersI18nKey.Running,
  [CONTAINER_STATUS.PENDING]: ContainersI18nKey.Preparing,
  [CONTAINER_STATUS.NOT_DEPLOYED]: ContainersI18nKey.NotRunning,
  [CONTAINER_STATUS.FAILED]: ContainersI18nKey.Failed,
  [CONTAINER_STATUS.STOPPED]: ContainersI18nKey.Stopped,
  [KubEventType.NORMAL]: KubEventsI18nKey.Normal,
  [KubEventType.WARNING]: KubEventsI18nKey.Warning,
};

export const STATUS_CLASSNAMES: Record<IMAGE_STATUS | CONTAINER_STATUS | KubEventType, string> = {
  [IMAGE_STATUS.BUILT]: 'bg-accent-secondary',
  [IMAGE_STATUS.BUILDING]: '',
  [IMAGE_STATUS.NOT_BUILT]: 'bg-red-400',
  [IMAGE_STATUS.BUILD_FAILED]: 'bg-red-400',
  [CONTAINER_STATUS.RUNNING]: 'bg-accent-secondary',
  [CONTAINER_STATUS.PENDING]: '',
  [CONTAINER_STATUS.NOT_DEPLOYED]: 'bg-red-400',
  [CONTAINER_STATUS.FAILED]: 'bg-red-400',
  [CONTAINER_STATUS.STOPPED]: 'bg-orange-400',
  [KubEventType.NORMAL]: 'bg-controls-disable',
  [KubEventType.WARNING]: 'bg-red-400',
};

export const MCP_IMAGE_TEMPLATE: Image = {
  id: '',
  $type: IMAGE_TYPE.MCP,
  version: '1.0.0',
  name: '',
  description: '',
  source: {
    $type: SOURCES[0].value as IMAGE_SOURCE_TYPE,
    imageUri: '',
    url: '',
  },
  transportType: IMAGE_TRANSPORT_TYPE.LOCAL,
  topics: [],
  buildStatus: IMAGE_STATUS.NOT_BUILT,
};

export const INTERCEPTOR_IMAGE_TEMPLATE: Image = {
  id: '',
  $type: IMAGE_TYPE.INTERCEPTOR,
  version: '1.0.0',
  name: '',
  description: '',
  source: {
    $type: IMAGE_SOURCE_TYPE.DOCKER,
    imageUri: '',
  },
  topics: [],
  buildStatus: IMAGE_STATUS.NOT_BUILT,
};
export const MODEL_IMAGE_TEMPLATE: Image = {
  id: '',
  $type: IMAGE_TYPE.MODEL,
  version: '1.0.0',
  name: '',
  description: '',
  source: {
    $type: IMAGE_SOURCE_TYPE.DOCKER,
    imageUri: '',
  },
  topics: [],
  buildStatus: IMAGE_STATUS.NOT_BUILT,
};

export const IMAGE_BUILD_POLL_INTERVAL = 5000;
