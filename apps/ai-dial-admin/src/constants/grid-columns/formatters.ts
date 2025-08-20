import Big from 'big.js';
import { ValueFormatterParams } from 'ag-grid-community';

import { ALL_ATTACHMENTS } from '@/src/constants/dial-base-entity';
import { AttachmentsI18nKey } from '@/src/constants/i18n';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { formatNumberByDelimiter } from '@/src/utils/formatting/number-formatting';

export const getFormattedResourceType = (value: string): string => {
  if (value === ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA) {
    return 'Application Runner';
  }
  if (value === ActivityAuditResourceType.INTERCEPTOR_TEMPLATE) {
    return 'Interceptor Template';
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
    price = new Big(params.data[params?.colDef?.field as string]);
  } catch (e) {
    if (e) {
      price = '';
    }
  }

  return `$${price}`;
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
