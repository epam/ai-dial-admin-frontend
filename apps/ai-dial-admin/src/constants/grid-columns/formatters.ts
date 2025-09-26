import Big from 'big.js';
import { ITooltipParams, ValueFormatterParams } from 'ag-grid-community';

import { ALL_ATTACHMENTS } from '@/src/constants/dial-base-entity';
import { AttachmentsI18nKey, EntitiesI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { formatNumberByDelimiter } from '@/src/utils/formatting/number-formatting';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';

export const getFormattedResourceType = (value: string, t: (key: string) => string): string => {
  if (value === ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA) {
    return t(EntitiesI18nKey.AppRunner);
  }
  if (value === ActivityAuditResourceType.INTERCEPTOR_TEMPLATE) {
    return t(EntitiesI18nKey.InterceptorTemplate);
  }
  return value;
};

export const formatAttachment = (value: string, t: (stringToTranslate: string) => string) => {
  if (value && value?.[0] === ALL_ATTACHMENTS) {
    return t(AttachmentsI18nKey.AllAttachments);
  }
  return value;
};

export const priceValueFormatter = (params: ValueFormatterParams) => {
  let price = null;
  try {
    price = new Big(params.data[params?.colDef?.field as string]).toString();
  } catch (e) {
    if (e) {
      price = '';
    }
  }

  return price;
};

export const numberValueFormatter = (params: ValueFormatterParams) => {
  let number = '';

  try {
    number = formatNumberByDelimiter(params.data[params?.colDef?.field as string]);
  } catch (e) {
    if (e) {
      number = '';
    }
  }

  return number;
};

export const sourceTypeFormatter = (value: string, t: (key: string) => string, view?: ApplicationRoute) => {
  if (value === SOURCE_TYPE.ADAPTER) {
    return t(SourceI18nKey.Adapter);
  } else if (value === SOURCE_TYPE.CONTAINER) {
    switch (view) {
      case ApplicationRoute.Models:
        return t(SourceI18nKey.ModelDeployment);
      case ApplicationRoute.Interceptors:
        return t(SourceI18nKey.InterceptorDeployment);
      case ApplicationRoute.Toolsets:
        return t(SourceI18nKey.MCPDeployment);
      default:
        return value;
    }
  } else if (value === SOURCE_TYPE.ENDPOINTS) {
    return t(SourceI18nKey.Endpoint);
  } else if (value === SOURCE_TYPE.RUNNER) {
    return t(SourceI18nKey.InterceptorTemplate);
  } else {
    return value;
  }
};

export const sourceValueFormatter = (params: ValueFormatterParams | ITooltipParams) => {
  if (!params.data?.source?.$type) {
    return params.value;
  }
  if (params.data.source.$type === SOURCE_TYPE.ADAPTER) {
    return params.data.source.adapterName;
  } else if (params.data.source.$type === SOURCE_TYPE.RUNNER) {
    return params.data.source.runnerName;
  } else if (params.data.source.$type === SOURCE_TYPE.CONTAINER) {
    return params.data.source.containerId;
  } else if (params.data.source.$type === SOURCE_TYPE.ENDPOINTS) {
    return params.data.endpoint;
  } else {
    return params.value;
  }
};
