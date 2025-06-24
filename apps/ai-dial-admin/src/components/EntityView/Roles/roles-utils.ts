import { ColDef, GridApi, IRowNode } from 'ag-grid-community';
import { isEqual } from 'lodash';

import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import { ACTION_COLUMN, NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import {
  getOpenInNewTabOperation,
  getRemoveOperation,
  getResetOperation,
  getSetNoLimitsOperation,
} from '@/src/constants/grid-columns/actions';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { NO_LIMITS_KEY } from '@/src/constants/role';
import { DialBaseEntity, DialRoleLimits, DialRoleLimitsMap } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';

export interface RolesGridData extends DialRoleLimits {
  name?: string;
}

export const getRolesGridData = (entity: DialBaseEntity, roles: DialRole[]): RolesGridData[] => {
  if (entity.isPublic) {
    return getAllRolesWithLimits(roles, entity);
  }

  return getRolesWithLimits(roles, entity.roleLimits);
};

const getAllRolesWithLimits = (roles: DialRole[], entity?: DialBaseEntity) => {
  const data: RolesGridData[] = [];
  roles.forEach((role) => {
    const limit = entity?.roleLimits?.[role.name || ''];
    data.push({
      ...role,
      day: getLimitData(limit?.day, entity?.defaultRoleLimit?.day),
      minute: getLimitData(limit?.minute, entity?.defaultRoleLimit?.minute),
      week: getLimitData(limit?.week, entity?.defaultRoleLimit?.week),
      month: getLimitData(limit?.month, entity?.defaultRoleLimit?.month),
    });
  });
  return data;
};

const getLimitData = (value?: string | null, defaultValue?: string | null) => {
  return value === null && defaultValue !== null ? null : value || defaultValue;
};

const getRolesWithLimits = (roles: DialRole[], limits?: DialRoleLimitsMap) => {
  if (limits == null) {
    return [];
  }
  const data: RolesGridData[] = [];

  Object.keys(limits).forEach((roleName) => {
    const role = roles.find((role) => role.name === roleName);
    const limit = limits?.[roleName];
    data.push({ ...role, ...limit });
  });

  return data;
};

export const LIMIT_COLUMNS = (
  defaultValues?: DialRoleLimits,
  onChange?: (value: number, data: DialRole, token: string) => void,
) => [
  {
    headerName: 'Tokens per minute',
    field: 'minute',
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      placeholder: NO_LIMITS_KEY,
      defaultValue: defaultValues?.minute,
      valueFormatter: limitValueFormatter,
      onChange,
    },
  },
  {
    headerName: 'Tokens per day',
    field: 'day',
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      placeholder: NO_LIMITS_KEY,
      defaultValue: defaultValues?.day,
      valueFormatter: limitValueFormatter,
      onChange,
    },
  },
  {
    headerName: 'Tokens per week',
    field: 'week',
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      placeholder: NO_LIMITS_KEY,
      defaultValue: defaultValues?.week,
      valueFormatter: limitValueFormatter,
      onChange,
    },
  },
  {
    headerName: 'Tokens per month',
    field: 'month',
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      placeholder: NO_LIMITS_KEY,
      defaultValue: defaultValues?.month,
      valueFormatter: limitValueFormatter,
      onChange,
    },
  },
];

export const getRolesColumnDefs = (
  entity: DialBaseEntity,
  onChangeLimits: ((value: number, data: DialRole, token: string) => void) | undefined,
  remove: (entity: DialRole) => void,
  open: (entity: DialRole) => void,
  resetToDefault: (entity: DialRole) => void,
  setNoLimits: (entity: DialRole) => void,
  resetToDefaultHidden: (api: GridApi, node: IRowNode) => boolean,
  isSetNoLimitsHidden: (api: GridApi, node: IRowNode) => boolean,
): ColDef[] => {
  const actions = [
    getOpenInNewTabOperation(open),
    getResetOperation(resetToDefault, resetToDefaultHidden),
    getSetNoLimitsOperation(setNoLimits, isSetNoLimitsHidden),
  ];

  if (!entity.isPublic) {
    actions.push(getRemoveOperation(remove));
  }

  return [...SIMPLE_ENTITY_COLUMNS, ...LIMIT_COLUMNS(entity.defaultRoleLimit, onChangeLimits), ACTION_COLUMN(actions)];
};

export const limitValueFormatter = (value: string) => {
  if (/^\d*$/.test(value)) {
    return value;
  }
};

export const isResetAvailable = (entity: DialBaseEntity): boolean => {
  return (
    entity.roleLimits != null &&
    Object.values(entity.roleLimits).some((limit) => !isEqual(limit, entity.defaultRoleLimit))
  );
};
