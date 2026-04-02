import { SelectOption, Step } from '@epam/ai-dial-ui-kit';
import {
  CONTAINER_TRANSPORT,
  CreateSteps,
  KubEventType,
  MODEL_TYPE,
  PROBE_TYPE,
  SCALING_STRATEGY_TYPE,
} from '@/src/types/deployments/containers';
import { ToolsetTransport } from '@/src/types/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { ContainersI18nKey, ErrorI18nKey, KubEventsI18nKey } from '@/src/constants/i18n';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import { Autoscaling, AutoscalingStrategy } from '@/src/models/deployments/containers';

export const POD_OBJECT_KIND = 'pod';

export const ENTITY_TRANSPORT: Record<CONTAINER_TRANSPORT, ToolsetTransport> = {
  [CONTAINER_TRANSPORT.SSE]: ToolsetTransport.SSE,
  [CONTAINER_TRANSPORT.HTTP]: ToolsetTransport.HTTP,
};

export const EVENT_TYPES: Record<KubEventType, string> = {
  [KubEventType.NORMAL]: KubEventsI18nKey.Normal,
  [KubEventType.WARNING]: KubEventsI18nKey.Warning,
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

export const AUTOSCALE_OPTIONS = (
  t: (key: string, options?: Record<string, string | number>) => string,
): SelectOption[] => [
  { label: t(ContainersI18nKey.ScaleToZeroNever), value: '0' },
  { label: t(ContainersI18nKey.ScaleToZeroAfter5Minutes), value: '300' },
  { label: t(ContainersI18nKey.ScaleToZeroAfter15Minutes), value: '900' },
  { label: t(ContainersI18nKey.ScaleToZeroAfter30Minutes), value: '1800' },
  { label: t(ContainersI18nKey.ScaleToZeroAfter1Hour), value: '3600' },
  { label: t(ContainersI18nKey.ScaleToZeroAfter2Hours), value: '7200' },
  { label: t(ContainersI18nKey.ScaleToZeroAfter6Hours), value: '21600' },
];

export const DEFAULT_SCALING: Autoscaling = {
  minReplicas: 0,
  maxReplicas: 1,
  scaleToZeroDelaySeconds: 300,
};

export const SERVING_SCALING: Autoscaling = {
  minReplicas: 1,
  maxReplicas: 1,
};

export const DEFAULT_STRATEGY: AutoscalingStrategy = {
  $type: SCALING_STRATEGY_TYPE.REQUESTS,
  threshold: 2,
};

export const DEFAULT_PROBE_CONFIG = {
  enabled: true,
  initialDelaySeconds: 1,
  failureThreshold: 3,
  periodSeconds: 10,
  timeoutSeconds: 1,
  probe: {
    $type: PROBE_TYPE.TCP,
  },
};

export const RESTART_REASONS = (
  t: (key: string, options?: Record<string, string | number>) => string,
): Record<string, string> => {
  return {
    ['StartError']: t(ErrorI18nKey.FailedToStart),
    ['OOMKilled']: t(ErrorI18nKey.RunOutOfMemory),
    ['Error']: t(ErrorI18nKey.ExitedWithError),
  };
};
