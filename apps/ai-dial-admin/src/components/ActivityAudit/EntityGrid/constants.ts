import { ColDef, ICellRendererParams } from 'ag-grid-community';

import { DOMAIN_ACCESS_POLICY_KEY, EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import ExtraDataCellRenderer from '@/src/components/Grid/CellRenderers/ExtraDataCellRenderer';
import ImageStatusCellRenderer from '@/src/components/Grid/CellRenderers/ImageStatusCellRenderer';
import PasswordCellRenderer from '@/src/components/Grid/CellRenderers/PasswordCellRenderer';
import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';
import { splitCommaList } from '@/src/utils/formatting/comma-list';
import {
  IMAGE_BUILDER_AUDIT_I18N_KEYS,
  IMAGE_TRANSPORT_I18N_KEYS,
  STATUS_I18N_KEYS,
} from '@/src/constants/deployments/images';
import { sourceTypeFormatter } from '@/src/constants/grid-columns/formatters';
import { EntityFieldsI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';
import { ActivityAuditResourceType, isImageDefinitionResource } from '@/src/types/activity-audit';
import { IMAGE_BUILDER_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE } from '@/src/types/deployments/images';

export const INTERCEPTORS_DIFF_COLUMNS = [
  { field: 'parameter', headerName: 'Order', width: 90, maxWidth: 90, filter: false },
  { field: 'value', headerName: 'Name' },
];

export const ENTITIES_DIFF_COLUMNS = [{ field: 'parameter', headerName: 'Name' }];

export const DOMAINS_DIFF_COLUMNS = [{ field: 'value', headerName: 'Domain' }];

export const ROLE_LIMITS_DIFF_COLUMNS = [
  { field: 'parameter', headerName: 'Name' },
  { field: 'minute', headerName: 'Per minute' },
  { field: 'day', headerName: 'Per day' },
  { field: 'week', headerName: 'Per week' },
  { field: 'month', headerName: 'Per month' },
  { field: 'enabled', headerName: 'Enabled' },
];

export const RESOURCE_DIFF_COLUMNS = (
  t: (stringToTranslate: string) => string,
  parameter?: string,
  resourceType?: ActivityAuditResourceType,
): ColDef[] => {
  const isImageRow = isImageDefinitionResource(resourceType);
  return [
    {
      field: 'parameter',
      headerName: 'Parameter',
      valueFormatter: ({ value }) => formatParameter(value, t, isImageRow),
      tooltipValueGetter: ({ value }) => formatParameter(value, t, isImageRow),
    },
    {
      field: 'value',
      headerName: 'Value',
      valueFormatter: (params) => formatValue(params.data?.parameter, params.value, t, isImageRow),
      tooltipValueGetter: (params) => formatValue(params.data?.parameter, params.value, t, isImageRow),
      cellRendererSelector: (params: ICellRendererParams) => {
        if (
          (parameter === EntityParameterKeys.KEYS && params.data?.parameter === 'key') ||
          params.data?.parameter === 'clientId'
        ) {
          return { component: PasswordCellRenderer };
        }
        if (parameter === EntityParameterKeys.UPSTREAMS && params.data?.parameter === 'extraData') {
          return { component: ExtraDataCellRenderer };
        }
        if (isImageRow && params.data?.parameter === 'buildStatus') {
          return { component: ImageStatusCellRenderer };
        }
        if (params.data?.parameter === 'topics') {
          return { component: TagsCellRenderer, params: { items: splitCommaList(params.value) } };
        }
        return void 0;
      },
    },
  ];
};

const formatParameter = (value: string, t: (stringToTranslate: string) => string, isImageRow?: boolean) => {
  if (isImageRow && value === '$type') {
    return t(EntityFieldsI18nKey.source);
  }
  if (isImageRow && value === 'url') {
    return t(EntityFieldsI18nKey.SourceURL);
  }
  const entityFieldKey = EntityFieldsI18nKey[value as keyof typeof EntityFieldsI18nKey];
  if (entityFieldKey) {
    return t(entityFieldKey);
  }
  const featuresKey = FeaturesI18nKey[value as keyof typeof FeaturesI18nKey];

  if (featuresKey) {
    return t(featuresKey);
  }
  return value;
};

const formatValue = (
  parameter: string | undefined,
  value: string,
  t: (key: string) => string,
  isImageRow?: boolean,
) => {
  if (parameter === '$type') {
    return sourceTypeFormatter(value, t);
  }
  if (parameter === DOMAIN_ACCESS_POLICY_KEY) {
    return value ? t(value) : value;
  }
  if (isImageRow) {
    if (parameter === 'buildStatus') {
      const key = STATUS_I18N_KEYS[value as IMAGE_STATUS];
      return key ? t(key) : value;
    }
    if (parameter === 'transportType') {
      const key = IMAGE_TRANSPORT_I18N_KEYS[value as IMAGE_TRANSPORT_TYPE];
      return key ? t(key) : value;
    }
    if (parameter === 'imageBuilder') {
      const key = IMAGE_BUILDER_AUDIT_I18N_KEYS[value as IMAGE_BUILDER_TYPE];
      return key ? t(key) : value;
    }
  }
  return value;
};
