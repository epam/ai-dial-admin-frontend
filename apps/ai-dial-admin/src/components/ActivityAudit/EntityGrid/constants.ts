import { ColDef, ICellRendererParams } from 'ag-grid-community';

import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import ExtraDataCellRenderer from '@/src/components/Grid/CellRenderers/ExtraDataCellRenderer';
import PasswordCellRenderer from '@/src/components/Grid/CellRenderers/PasswordCellRenderer';
import { sourceTypeFormatter } from '@/src/constants/grid-columns/formatters';
import { EntityFieldsI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';

export const INTERCEPTORS_DIFF_COLUMNS = [
  { field: 'parameter', headerName: 'Order', width: 90, maxWidth: 90, filter: false },
  { field: 'value', headerName: 'Name' },
];

export const ENTITIES_DIFF_COLUMNS = [{ field: 'parameter', headerName: 'Name' }];

export const ROLE_LIMITS_DIFF_COLUMNS = [
  { field: 'parameter', headerName: 'Name' },
  { field: 'minute', headerName: 'Per minute' },
  { field: 'day', headerName: 'Per day' },
  { field: 'week', headerName: 'Per week' },
  { field: 'month', headerName: 'Per month' },
  { field: 'enabled', headerName: 'Enabled' },
];

export const RESOURCE_DIFF_COLUMNS = (t: (stringToTranslate: string) => string, parameter?: string): ColDef[] => {
  return [
    {
      field: 'parameter',
      headerName: 'Parameter',
      valueFormatter: ({ value }) => formatParameter(value, t),
      tooltipValueGetter: ({ value }) => formatParameter(value, t),
    },
    {
      field: 'value',
      headerName: 'Value',
      valueFormatter: (params) =>
        params.data.parameter === '$type' ? sourceTypeFormatter(params.value, t) : params.value,
      tooltipValueGetter: (params) =>
        params.data.parameter === '$type' ? sourceTypeFormatter(params.value, t) : params.value,
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
        return void 0;
      },
    },
  ];
};

const formatParameter = (value: string, t: (stringToTranslate: string) => string) => {
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
