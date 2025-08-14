import { ColDef, ICellRendererParams } from 'ag-grid-community';

import ExtraDataCellRenderer from '@/src/components/Grid/CellRenderers/ExtraDataCellRenderer';
import PasswordCellRenderer from '@/src/components/Grid/CellRenderers/PasswordCellRenderer';
import { FeaturesI18nKey } from '@/src/constants/i18n';
import { ParameterNamesI18nKey } from '@/src/components/ActivityAudit/constants';

export const INTERCEPTORS_DIFF_COLUMNS = [
  { field: 'parameter', headerName: 'Order', width: 90, maxWidth: 90 },
  { field: 'value', headerName: 'Name' },
];

export const ENTITIES_DIFF_COLUMNS = [{ field: 'parameter', headerName: 'Name' }];

export const ROLE_LIMITS_DIFF_COLUMNS = [
  { field: 'parameter', headerName: 'Name' },
  { field: 'minute', headerName: 'Per minute' },
  { field: 'day', headerName: 'Per day' },
  { field: 'week', headerName: 'Per week' },
  { field: 'month', headerName: 'Per month' },
];

export const RESOURCE_DIFF_COLUMNS = (t: (stringToTranslate: string) => string): ColDef[] => [
  {
    field: 'parameter',
    headerName: 'Parameter',
    valueFormatter: ({ value }) => formatParameter(value, t),
    tooltipValueGetter: ({ value }) => formatParameter(value, t),
  },
  {
    field: 'value',
    headerName: 'Value',
    cellRendererSelector: (params: ICellRendererParams) => {
      switch (params.data?.parameter) {
        case 'key':
          return { component: PasswordCellRenderer };
        case 'extraData':
          return { component: ExtraDataCellRenderer };
        default:
          return void 0;
      }
    },
  },
];

const formatParameter = (value: string, t: (stringToTranslate: string) => string) => {
  const parametersKey = ParameterNamesI18nKey[value as keyof typeof ParameterNamesI18nKey];
  if (parametersKey) {
    return t(parametersKey);
  }
  const featuresKey = FeaturesI18nKey[value as keyof typeof FeaturesI18nKey];

  if (featuresKey) {
    return t(featuresKey);
  }
  return value;
};
