import Big from 'big.js';

import { ALL_ATTACHMENTS } from '@/src/constants/dial-base-entity';
import { AttachmentsI18nKey, BasicI18nKey, EntitiesI18nKey, MenuI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { formatNumberByDelimiter } from '@/src/utils/formatting/number-formatting';
import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';

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
  return value;
};

export const getTopics = (data?: { topics?: string[]; descriptionKeywords?: string[] }) => {
  const value = data?.topics || data?.descriptionKeywords;
  return value?.length === 0 ? null : value?.sort() || null;
};

export const formatAttachment = (value: string, t: (stringToTranslate: string) => string) => {
  if (value && value?.[0] === ALL_ATTACHMENTS) {
    return t(AttachmentsI18nKey.AllAttachments);
  }
  return value;
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

export const numberValueFormatter = (value?: string | number) => {
  return formatNumberByDelimiter(value);
};

export const sourceTypeFormatter = (value: string, t: (key: string) => string, view?: ApplicationRoute) => {
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
  } else if (value === SOURCE_TYPE.RUNNER) {
    return t(SourceI18nKey.InterceptorTemplate);
  } else {
    return value;
  }
};

export const sourceValueFormatter = (data?: { source: SOURCE_FIELD; endpoint?: string }, value?: string) => {
  if (!data?.source?.$type) {
    return value;
  }
  if (data.source.$type === SOURCE_TYPE.ADAPTER) {
    return data.source.adapterName;
  } else if (data.source.$type === SOURCE_TYPE.RUNNER) {
    return data.source.runnerName;
  } else if (data.source.$type === SOURCE_TYPE.CONTAINER) {
    return data.source.containerId;
  } else if (data.source.$type === SOURCE_TYPE.ENDPOINTS) {
    return data.endpoint;
  } else {
    return value;
  }
};

export const formatRequired = (value: string, t: (stringToTranslate: string) => string) => {
  return value ? t(BasicI18nKey.Yes) : t(BasicI18nKey.No);
};
