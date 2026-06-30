import { Big } from 'big.js';

import { ALL_ATTACHMENTS } from '@/src/constants/dial-base-entity';
import { IMAGE_SOURCE_TYPE_I18N_KEYS } from '@/src/constants/deployments/images';
import { BasicI18nKey, EntitiesI18nKey, MenuI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { IMAGE_SOURCE_TYPE } from '@/src/types/deployments/images';
import { formatNumberByDelimiter } from '@/src/utils/formatting/number-formatting';
import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';
import { CONTAINER_SOURCE_TYPE, ContainerSource } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { convertBytesToMb, convertCoresToMilliCores } from '@/src/utils/deployments/containers';
import { isCodeAppSource } from '@/src/utils/entities/application-source';

export const getFormattedResourceType = (value: string, t: (key: string) => string): string => {
  if (value === ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA) {
    return t(EntitiesI18nKey.AppRunner);
  }
  if (value === ActivityAuditResourceType.INTERCEPTOR_TEMPLATE) {
    return t(EntitiesI18nKey.InterceptorTemplate);
  }

  if (value === ActivityAuditResourceType.SYSTEM_PROPERTIES) {
    return t(MenuI18nKey.SystemProperties);
  }

  switch (value) {
    case ActivityAuditResourceType.ADAPTER_DEPLOYMENT:
      return t(EntitiesI18nKey.AdapterContainer);
    case ActivityAuditResourceType.APPLICATION_DEPLOYMENT:
      return t(EntitiesI18nKey.ApplicationContainer);
    case ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT:
      return t(EntitiesI18nKey.InterceptorContainer);
    case ActivityAuditResourceType.MCP_DEPLOYMENT:
      return t(EntitiesI18nKey.McpContainer);
    case ActivityAuditResourceType.NIM_DEPLOYMENT:
    case ActivityAuditResourceType.INFERENCE_DEPLOYMENT:
      return t(EntitiesI18nKey.ModelServingLabel);
    case ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION:
    case ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION:
    case ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION:
    case ActivityAuditResourceType.MCP_IMAGE_DEFINITION:
      return t(EntitiesI18nKey.Image);
    case ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST:
      return t(EntitiesI18nKey.GlobalFirewall);
  }

  return value;
};

export type ResourceTypeLabelMap = Record<string, ActivityAuditResourceType[]>;

export const buildResourceTypeLabelMap = (t: (key: string) => string): ResourceTypeLabelMap => {
  const map: ResourceTypeLabelMap = {};
  for (const value of Object.values(ActivityAuditResourceType)) {
    const label = getFormattedResourceType(value, t).toLowerCase();
    if (!map[label]) {
      map[label] = [];
    }
    map[label].push(value);
  }
  return map;
};

export const getTopics = (data?: { topics?: string[]; descriptionKeywords?: string[] }) => {
  const value = data?.topics || data?.descriptionKeywords;
  return value?.length === 0 ? null : value?.sort() || null;
};

export const formatAttachment = (value: string) => {
  if (value && value?.[0] === ALL_ATTACHMENTS) {
    return '*/*';
  } else if (value) {
    return value.toString();
  } else {
    return '';
  }
};

export const priceValueFormatter = (value?: string | number) => {
  let price = null;
  try {
    price = new Big(value || '').toString();
  } catch (e) {
    if (e) {
      price = '';
    }
  }

  return price;
};

export const currencyValueFormatter = (value?: string | number): string => {
  const formatted = priceValueFormatter(value);
  return formatted ? `$${formatted}` : '';
};

export const numberValueFormatter = (value?: string | number) => {
  return formatNumberByDelimiter(value);
};

export const sourceTypeFormatter = (
  value: string,
  t: (key: string) => string,
  view?: ApplicationRoute,
  data?: { source?: SOURCE_FIELD; endpoint?: string | null; editorUrl?: string },
  codeAppEditorUrl?: string,
) => {
  if (data && isCodeAppSource(data, codeAppEditorUrl)) {
    return t(SourceI18nKey.CodeApp);
  }
  const imageSourceKey = IMAGE_SOURCE_TYPE_I18N_KEYS[value as IMAGE_SOURCE_TYPE];
  if (imageSourceKey) {
    return t(imageSourceKey);
  }
  if (value === SOURCE_TYPE.ADAPTER) {
    return t(SourceI18nKey.Adapter);
  } else if (value === SOURCE_TYPE.CONTAINER) {
    switch (view) {
      case ApplicationRoute.Models:
        return t(SourceI18nKey.ModelServing);
      case ApplicationRoute.Interceptors:
        return t(SourceI18nKey.InterceptorContainer);
      case ApplicationRoute.Toolsets:
        return t(SourceI18nKey.McpContainer);
      case ApplicationRoute.Adapters:
        return t(SourceI18nKey.AdapterContainer);
      case ApplicationRoute.Applications:
        return t(SourceI18nKey.ApplicationContainer);
      default:
        return value;
    }
  } else if (value === SOURCE_TYPE.ENDPOINTS) {
    switch (view) {
      case ApplicationRoute.Models:
        return t(SourceI18nKey.ExternalEndpoint);
      default:
        return t(SourceI18nKey.Endpoint);
    }
  } else if (value === SOURCE_TYPE.SCHEMA) {
    return t(EntitiesI18nKey.AppRunner);
  } else if (value === SOURCE_TYPE.MCP_REGISTRY) {
    return t(SourceI18nKey.McpRegistry);
  } else if (value === SOURCE_TYPE.RUNNER) {
    return t(SourceI18nKey.InterceptorTemplate);
  } else {
    return value;
  }
};

export const sourceValueFormatter = (
  data?: { source: SOURCE_FIELD; endpoint?: string; baseEndpoint?: string },
  value?: string,
  view?: ApplicationRoute,
) => {
  if (!data?.source?.$type) {
    return value;
  }
  if (data.source.$type === SOURCE_TYPE.ADAPTER) {
    return data.source.adapterName;
  } else if (data.source.$type === SOURCE_TYPE.RUNNER) {
    return data.source.runnerName;
  } else if (data.source.$type === SOURCE_TYPE.CONTAINER) {
    return data.source.containerId;
  } else if (data.source.$type === SOURCE_TYPE.SCHEMA) {
    return data.source.applicationTypeSchemaId;
  } else if (data.source.$type === SOURCE_TYPE.MCP_REGISTRY) {
    return data.source.serverVersion
      ? `${data.source.serverName} (${data.source.serverVersion})`
      : data.source.serverName;
  } else if (data.source.$type === SOURCE_TYPE.ENDPOINTS) {
    return view === ApplicationRoute.Adapters ? data.baseEndpoint : data.endpoint;
  } else {
    return value;
  }
};

export const containerSourceTypeLabel = (
  source: ContainerSource | undefined,
  t: (key: string, options?: Record<string, string>) => string,
  type: string,
): string => {
  if (source?.externalRegistryRef) {
    return t(SourceI18nKey.McpRegistry);
  }
  switch (source?.$type) {
    case CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE:
      return t(SourceI18nKey.InternalImage, { type });
    case CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE:
      return t(SourceI18nKey.DockerImageReference);
    default:
      return source?.$type || '';
  }
};

export const containerSourceNameLabel = (source: ContainerSource | undefined): string => {
  if (source?.externalRegistryRef) {
    const ref = source.externalRegistryRef;
    return ref.version ? `${ref.packageName} (${ref.version})` : ref.packageName;
  }
  if (source?.$type === CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE) {
    return source.imageDefinitionId || '';
  }
  if (source?.$type === CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE) {
    return source.imageReference || '';
  }
  return '';
};

export const formatRequired = (value: string, t: (stringToTranslate: string) => string) => {
  return value ? t(BasicI18nKey.Required) : t(BasicI18nKey.Optional);
};

export const toNumberOrNull = (value: string | number | undefined | null): number | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const identity = (value: string): string => value;

const parseResourceValue = (raw: string | undefined, convert: (value: string) => string): number | null => {
  if (raw === undefined || raw === '') {
    return null;
  }
  return toNumberOrNull(convert(raw));
};

const formatResourceValue = (value: number | null, suffix: string): string => {
  return value === null ? '' : `${value}${suffix}`;
};

export const getCpuColumnValue = (raw: string | undefined): number | null =>
  parseResourceValue(raw, convertCoresToMilliCores);

export const getMemoryColumnValue = (raw: string | undefined): number | null =>
  parseResourceValue(raw, convertBytesToMb);

export const getGpuColumnValue = (raw: string | undefined): number | null => parseResourceValue(raw, identity);

export const formatCpuColumnValue = (value: number | null): string => formatResourceValue(value, ' m');

export const formatMemoryColumnValue = (value: number | null): string => formatResourceValue(value, ' Mb');

export const formatGpuColumnValue = (value: number | null): string => formatResourceValue(value, '');
