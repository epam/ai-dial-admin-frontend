import { SelectOption, Step } from '@epam/ai-dial-ui-kit';
import {
  CONTAINER_TRANSPORT,
  CreateSteps,
  KubEventType,
  MODEL_SOURCE_TYPE,
  MODEL_TYPE,
} from '@/src/types/deployments/containers';
import { ToolsetTransport } from '@/src/types/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { ContainersI18nKey, KubEventsI18nKey } from '@/src/constants/i18n';
import { getTranslatedType } from '@/src/utils/deployments/entity';

export const POD_OBJECT_KIND = 'pod';

export const ENTITY_TRANSPORT: Record<CONTAINER_TRANSPORT, ToolsetTransport> = {
  [CONTAINER_TRANSPORT.SSE]: ToolsetTransport.SSE,
  [CONTAINER_TRANSPORT.HTTP]: ToolsetTransport.HTTP,
};

export const EVENT_TYPES: Record<KubEventType, string> = {
  [KubEventType.NORMAL]: KubEventsI18nKey.Normal,
  [KubEventType.WARNING]: KubEventsI18nKey.Warning,
};

export const TRANSPORTS: SelectOption[] = [
  { label: 'HTTP', value: CONTAINER_TRANSPORT.HTTP },
  { label: 'SSE', value: CONTAINER_TRANSPORT.SSE },
];

export const MODELS_SOURCE_TYPES: Record<MODEL_SOURCE_TYPE, ContainersI18nKey> = {
  [MODEL_SOURCE_TYPE.NIM]: ContainersI18nKey.ModelTypeNIM,
  [MODEL_SOURCE_TYPE.HF]: ContainersI18nKey.ModelTypeHF,
};

export const MODEL_TYPES: Record<MODEL_TYPE, ContainersI18nKey> = {
  [MODEL_TYPE.NIM]: ContainersI18nKey.ModelTypeNIM,
  [MODEL_TYPE.HF]: ContainersI18nKey.ModelTypeHF,
};

export const CREATE_CONTAINER_STEPS = (
  route: ApplicationRoute,
  t: (key: string, options?: Record<string, string | number>) => string,
): Step[] => [
  {
    id: CreateSteps.IMAGE,
    name: t(ContainersI18nKey.ContainerImage, { type: getTranslatedType(route, t) }),
  },
  { id: CreateSteps.PROPERTIES, name: t(ContainersI18nKey.ContainerProperties) },
];
