import { ColDef } from 'ag-grid-community';

import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import { NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import { RolesI18nKey } from '@/src/constants/i18n';
import { DialCoreRoleLimits } from '@/src/models/dial/role-limits';
import { PlatformRoleModelLimitRow, PlatformRoleModelOption } from './models';

const TOKEN_COLUMNS: Array<{ field: keyof DialCoreRoleLimits; headerName: string }> = [
  { field: 'minute', headerName: 'Tokens per minute' },
  { field: 'day', headerName: 'Tokens per day' },
  { field: 'week', headerName: 'Tokens per week' },
  { field: 'month', headerName: 'Tokens per month' },
];

export const getPlatformRoleModelColumns = (
  onChange: (value: number | string, data: PlatformRoleModelLimitRow, token: keyof DialCoreRoleLimits) => void,
  isReadOnlyAdmin: boolean,
): ColDef<PlatformRoleModelLimitRow>[] => [
  {
    field: 'name',
    headerName: 'Name',
    sort: 'asc',
  },
  ...TOKEN_COLUMNS.map(({ field, headerName }) => ({
    field,
    headerName,
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      placeholder: RolesI18nKey.NoLimits,
      inputType: 'number',
      min: 0,
      hideTriangle: true,
      onChange: (value: number | string, data: PlatformRoleModelLimitRow) => onChange(value, data, field),
      isReadonly: isReadOnlyAdmin,
    },
  })),
];

export const MODEL_PICKER_COLUMNS: ColDef<PlatformRoleModelOption>[] = [
  {
    field: 'name',
    headerName: 'Name',
    sort: 'asc',
  },
];
