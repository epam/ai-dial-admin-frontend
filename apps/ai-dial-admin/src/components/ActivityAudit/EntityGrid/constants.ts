import { ColDef, ICellRendererParams } from 'ag-grid-community';

import { DOMAIN_ACCESS_POLICY_KEY, EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import {
  CONTAINER_ROW_LABEL_KEYS,
  formatContainerSourceType,
  formatContainerValue,
} from '@/src/components/ActivityAudit/EntityGrid/container-formatters';
import EnvVarValueCellRenderer from '@/src/components/Grid/CellRenderers/EnvVarValueCellRenderer';
import ExtraDataCellRenderer from '@/src/components/Grid/CellRenderers/ExtraDataCellRenderer';
import DeploymentStatusCellRenderer from '@/src/components/Grid/CellRenderers/DeploymentStatusCellRenderer';

import PasswordCellRenderer from '@/src/components/Grid/CellRenderers/PasswordCellRenderer';
import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';
import {
  IMAGE_BUILDER_AUDIT_I18N_KEYS,
  IMAGE_TRANSPORT_I18N_KEYS,
  STATUS_I18N_KEYS,
} from '@/src/constants/deployments/images';
import { sourceTypeFormatter } from '@/src/constants/grid-columns/formatters';
import { EntityFieldsI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';
import {
  ActivityAuditResourceType,
  isContainerDeploymentResource,
  isImageDefinitionResource,
} from '@/src/types/activity-audit';
import { IMAGE_BUILDER_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE } from '@/src/types/deployments/images';
import { splitCommaList } from '@/src/utils/formatting/comma-list';

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
  t: (stringToTranslate: string, params?: Record<string, string>) => string,
  parameter?: string,
  resourceType?: ActivityAuditResourceType,
): ColDef[] => {
  const isImageRow = isImageDefinitionResource(resourceType);
  const isContainerRow = isContainerDeploymentResource(resourceType);
  return [
    {
      field: 'parameter',
      headerName: 'Parameter',
      valueFormatter: ({ value }) => formatParameter(value, t, isImageRow, isContainerRow),
      tooltipValueGetter: ({ value }) => formatParameter(value, t, isImageRow, isContainerRow),
    },
    {
      field: 'value',
      headerName: 'Value',
      valueFormatter: (params) =>
        formatValue(params.data?.parameter, params.value, t, isImageRow, isContainerRow, resourceType),
      tooltipValueGetter: (params) =>
        formatValue(params.data?.parameter, params.value, t, isImageRow, isContainerRow, resourceType),
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
          return { component: DeploymentStatusCellRenderer };
        }
        if (isContainerRow && params.data?.parameter === 'status') {
          return { component: DeploymentStatusCellRenderer };
        }
        if (params.data?.parameter === 'topics') {
          return { component: TagsCellRenderer, params: { items: splitCommaList(params.value) } };
        }
        if (parameter === EntityParameterKeys.METADATA && params.data?.parameter === 'envValue') {
          return { component: EnvVarValueCellRenderer };
        }
        return void 0;
      },
    },
  ];
};

const formatParameter = (
  value: string,
  t: (stringToTranslate: string) => string,
  isImageRow?: boolean,
  isContainerRow?: boolean,
) => {
  if ((isImageRow || isContainerRow) && value === '$type') {
    return t(EntityFieldsI18nKey.source);
  }
  if (isImageRow && value === 'url') {
    return t(EntityFieldsI18nKey.SourceURL);
  }
  const containerRowKey = CONTAINER_ROW_LABEL_KEYS[value];
  if (containerRowKey) {
    return t(containerRowKey);
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
  t: (key: string, params?: Record<string, string>) => string,
  isImageRow?: boolean,
  isContainerRow?: boolean,
  resourceType?: ActivityAuditResourceType,
) => {
  if (parameter === '$type') {
    if (isContainerRow) {
      const containerLabel = formatContainerSourceType(value, t, resourceType);
      if (containerLabel != null) return containerLabel;
    }
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
  if (isContainerRow) {
    const containerValue = formatContainerValue(parameter, value, t);
    if (containerValue != null) return containerValue;
  }
  return value;
};
