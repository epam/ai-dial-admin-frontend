import { STATUS_I18N_KEYS } from '@/src/constants/deployments/images';
import {
  BasicI18nKey,
  ContainersI18nKey,
  EntitiesI18nKey,
  EntityFieldsI18nKey,
  EnvVariablesI18nKey,
  ImagesI18nKey,
  SourceI18nKey,
} from '@/src/constants/i18n';
import { ContainerValueFormatter, TranslateFn } from '@/src/models/activity-audit';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { CONTAINER_SOURCE_TYPE, CONTAINER_TRANSPORT, PROBE_TYPE } from '@/src/types/deployments/containers';
import { formatCpuValue, formatMemoryValue } from '@/src/utils/deployments/containers';

// Maps each container-row parameter name to the i18n key that labels its row.
// Used by the audit detail's "Parameter" column.
export const CONTAINER_ROW_LABEL_KEYS: Record<
  string,
  EntityFieldsI18nKey | ContainersI18nKey | ImagesI18nKey | EnvVariablesI18nKey | BasicI18nKey
> = {
  imageDefinition: ImagesI18nKey.Image,
  envName: EnvVariablesI18nKey.Name,
  envDescription: EnvVariablesI18nKey.Description,
  envValue: BasicI18nKey.Value,
  envMountType: EnvVariablesI18nKey.MountType,
  cpuRequest: EntityFieldsI18nKey.CPURequest,
  cpuLimit: EntityFieldsI18nKey.CPULimit,
  memoryRequest: EntityFieldsI18nKey.MemoryRequest,
  memoryLimit: EntityFieldsI18nKey.MemoryLimit,
  gpuRequest: EntityFieldsI18nKey.GPURequest,
  gpuLimit: EntityFieldsI18nKey.GPULimit,
  minReplicas: ContainersI18nKey.MinReplicas,
  maxReplicas: ContainersI18nKey.MaxReplicas,
  scaleToZeroDelaySeconds: ContainersI18nKey.ScaleToZero,
  scalingStrategyType: EntityFieldsI18nKey.ScalingStrategyType,
  scalingStrategyThreshold: ContainersI18nKey.Threshold,
  probeEnabled: EntityFieldsI18nKey.ProbeEnabled,
  initialDelaySeconds: EntityFieldsI18nKey.InitialDelaySeconds,
  periodSeconds: EntityFieldsI18nKey.PeriodSeconds,
  timeoutSeconds: EntityFieldsI18nKey.TimeoutSeconds,
  failureThreshold: EntityFieldsI18nKey.FailureThreshold,
  probeType: EntityFieldsI18nKey.ProbeType,
  probePath: EntityFieldsI18nKey.ProbePath,
  probePort: EntityFieldsI18nKey.ProbePort,
  command: EntityFieldsI18nKey.Command,
  args: EntityFieldsI18nKey.Arguments,
  containerPort: EntityFieldsI18nKey.Port,
  containerGrpcPort: EntityFieldsI18nKey.GRPCPort,
  mcpEndpointPath: EntityFieldsI18nKey.ContainerEndpointPath,
  imageRef: EntityFieldsI18nKey.ImageURI,
  imageReference: EntityFieldsI18nKey.DockerImageReference,
  modelName: EntityFieldsI18nKey.HFModelName,
};

// Value-formatting tables for atomic row types.
const CONTAINER_TRANSPORT_LABELS: Record<string, string> = {
  [CONTAINER_TRANSPORT.SSE]: 'SSE',
  [CONTAINER_TRANSPORT.HTTP]: 'HTTP',
};

const PROBE_TYPE_LABELS: Record<string, string> = {
  [PROBE_TYPE.TCP]: 'TCP',
  [PROBE_TYPE.HTTP_GET]: 'HTTP GET',
};

const SCALING_STRATEGY_TYPE_LABELS: Record<string, string> = {
  active_requests: 'Pending requests',
};

const MOUNT_TYPE_LABEL_KEYS: Record<string, EnvVariablesI18nKey> = {
  content: EnvVariablesI18nKey.MountTypeContent,
  secure_content: EnvVariablesI18nKey.MountTypeSecureContent,
  secure_file: EnvVariablesI18nKey.MountTypeSecureFile,
};

const SCALE_TO_ZERO_LABEL_KEYS: Record<string, ContainersI18nKey> = {
  '0': ContainersI18nKey.ScaleToZeroNever,
  '300': ContainersI18nKey.ScaleToZeroAfter5Minutes,
  '900': ContainersI18nKey.ScaleToZeroAfter15Minutes,
  '1800': ContainersI18nKey.ScaleToZeroAfter30Minutes,
  '3600': ContainersI18nKey.ScaleToZeroAfter1Hour,
};

const CONTAINER_SOURCE_TYPE_LABEL_KEYS: Record<string, SourceI18nKey> = {
  [CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE]: SourceI18nKey.InternalImage,
  [CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE]: SourceI18nKey.DockerImageReference,
  [CONTAINER_SOURCE_TYPE.NGC_REGISTRY]: SourceI18nKey.NgcRegistry,
  [CONTAINER_SOURCE_TYPE.HUGGINGFACE]: SourceI18nKey.HuggingFace,
  'mcp-registry': SourceI18nKey.McpRegistry,
};

const CONTAINER_SUBTYPE_LABEL_KEYS: Partial<Record<ActivityAuditResourceType, EntitiesI18nKey>> = {
  [ActivityAuditResourceType.MCP_DEPLOYMENT]: EntitiesI18nKey.MCP,
  [ActivityAuditResourceType.ADAPTER_DEPLOYMENT]: EntitiesI18nKey.Adapter,
  [ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT]: EntitiesI18nKey.Interceptor,
  [ActivityAuditResourceType.APPLICATION_DEPLOYMENT]: EntitiesI18nKey.Application,
  [ActivityAuditResourceType.NIM_DEPLOYMENT]: EntitiesI18nKey.Model,
  [ActivityAuditResourceType.INFERENCE_DEPLOYMENT]: EntitiesI18nKey.Model,
};

const translateLookup =
  (table: Record<string, string>) =>
  (v: string, t: TranslateFn): string => {
    const key = table[v];
    return key ? t(key) : v;
  };

const plainLookup =
  (table: Record<string, string>) =>
  (v: string): string =>
    table[v] ?? v;

// One formatter per row parameter. Lookup misses fall through to the raw value.
const CONTAINER_VALUE_FORMATTERS: Record<string, ContainerValueFormatter> = {
  status: translateLookup(STATUS_I18N_KEYS as Record<string, string>),
  cpuRequest: (v) => formatCpuValue(v),
  cpuLimit: (v) => formatCpuValue(v),
  memoryRequest: (v) => formatMemoryValue(v),
  memoryLimit: (v) => formatMemoryValue(v),
  probeEnabled: (v, t) => (v === 'true' ? t(BasicI18nKey.Yes) : v === 'false' ? t(BasicI18nKey.No) : v),
  probeType: plainLookup(PROBE_TYPE_LABELS),
  envMountType: translateLookup(MOUNT_TYPE_LABEL_KEYS),
  scaleToZeroDelaySeconds: translateLookup(SCALE_TO_ZERO_LABEL_KEYS),
  scalingStrategyType: plainLookup(SCALING_STRATEGY_TYPE_LABELS),
  transport: plainLookup(CONTAINER_TRANSPORT_LABELS),
};

export const formatContainerSourceType = (
  value: string,
  t: TranslateFn,
  resourceType?: ActivityAuditResourceType,
): string | undefined => {
  const sourceKey = CONTAINER_SOURCE_TYPE_LABEL_KEYS[value];
  if (!sourceKey) return undefined;
  if (sourceKey === SourceI18nKey.InternalImage) {
    const typeKey = resourceType && CONTAINER_SUBTYPE_LABEL_KEYS[resourceType];
    return t(sourceKey, { type: typeKey ? t(typeKey) : '' });
  }
  return t(sourceKey);
};

export const formatContainerValue = (
  parameter: string | undefined,
  value: string,
  t: TranslateFn,
): string | undefined => {
  const formatter = parameter && CONTAINER_VALUE_FORMATTERS[parameter];
  return formatter ? formatter(value, t) : undefined;
};
