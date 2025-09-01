import { ColDef, Column, GridApi, IRowNode } from 'ag-grid-community';

import { RolesGridData } from '@/src/components/EntityView/Roles/models';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import { ACTION_COLUMN, NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import {
  getOpenInNewTabOperation,
  getRemoveOperation,
  getResetOperation,
  getSetNoLimitsOperation,
} from '@/src/constants/grid-columns/actions';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialRoleLimits, DialRoleLimitsMap, DialRoleShareMap } from '@/src/models/dial/role-limits';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { cellRenderParams } from './constants';

export const isDisableRole = (entity: DialBaseEntity) => {
  return !Object.keys(entity.roleLimits || {}).length && !entity.isPublic;
};

export const getRolesGridData = (entity: DialBaseEntity, roles: DialRole[]): RolesGridData[] => {
  if (entity.isPublic) {
    return getAllRolesWithLimits(roles, entity);
  }

  return getRolesWithLimits(roles, entity.roleLimits, entity.roleShareResourceLimits);
};

const getAllRolesWithLimits = (roles: DialRole[], entity?: DialBaseEntity) => {
  const data: RolesGridData[] = [];
  roles.forEach((role) => {
    const limit = entity?.roleLimits?.[role.name || ''];
    const share = entity?.roleShareResourceLimits?.[role.name || ''];
    data.push({
      ...role,
      day: getLimitData(limit?.day, entity?.defaultRoleLimit?.day),
      minute: getLimitData(limit?.minute, entity?.defaultRoleLimit?.minute),
      week: getLimitData(limit?.week, entity?.defaultRoleLimit?.week),
      month: getLimitData(limit?.month, entity?.defaultRoleLimit?.month),
      invitationTtl: getLimitData(share?.invitationTtl, entity?.defaultRoleShareResourceLimit?.invitationTtl),
      maxAcceptedUsers: getLimitData(share?.maxAcceptedUsers, entity?.defaultRoleShareResourceLimit?.maxAcceptedUsers),
    });
  });
  return data;
};

const getLimitData = (value?: string | null, defaultValue?: string | null) => {
  return value === null && defaultValue !== null ? null : value || defaultValue;
};

const getRolesWithLimits = (roles: DialRole[], limits?: DialRoleLimitsMap, shares?: DialRoleShareMap) => {
  if (limits == null) {
    return [];
  }
  const data: RolesGridData[] = [];

  Object.keys(limits).forEach((roleName) => {
    const role = roles.find((role) => role.name === roleName);
    const limit = limits?.[roleName];
    const share = shares?.[roleName];
    data.push({ ...role, ...limit, ...share });
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
      ...cellRenderParams,
      defaultValue: defaultValues?.minute,
      onChange,
    },
  },
  {
    headerName: 'Tokens per day',
    field: 'day',
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      ...cellRenderParams,
      defaultValue: defaultValues?.day,
      onChange,
    },
  },
  {
    headerName: 'Tokens per week',
    field: 'week',
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      ...cellRenderParams,
      defaultValue: defaultValues?.week,
      onChange,
    },
  },
  {
    headerName: 'Tokens per month',
    field: 'month',
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      ...cellRenderParams,
      defaultValue: defaultValues?.month,
      onChange,
    },
  },
  {
    headerName: 'Expiration time',
    field: 'invitationTtl',
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      ...cellRenderParams,
      onChange,
    },
  },
  {
    headerName: 'Max users',
    field: 'maxAcceptedUsers',
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      ...cellRenderParams,
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
  view: ApplicationRoute,
): ColDef[] => {
  const actions = [getOpenInNewTabOperation(open)];
  const colDefs = [...SIMPLE_ENTITY_COLUMNS];

  if (view !== ApplicationRoute.Routes) {
    actions.push(
      ...[
        getResetOperation(resetToDefault, resetToDefaultHidden),
        getSetNoLimitsOperation(setNoLimits, isSetNoLimitsHidden),
      ],
    );
    colDefs.push(...LIMIT_COLUMNS(entity.defaultRoleLimit, onChangeLimits));
  }

  if (!entity.isPublic) {
    actions.push(getRemoveOperation(remove));
  }

  return [...colDefs, ACTION_COLUMN(actions)];
};

export const isResetAvailable = (entity: DialBaseEntity): boolean => {
  return (
    entity.roleLimits != null &&
    Object.values(entity.roleLimits).some((limit) => !isEqualSkippingUndefined(limit, entity.defaultRoleLimit))
  );
};

export const isSetNoLimitsHidden = (api: GridApi, node: IRowNode) => {
  const month = api.getCellValue({
    colKey: api.getColumn('month') as Column,
    rowNode: node,
  });
  const week = api.getCellValue({
    colKey: api.getColumn('week') as Column,
    rowNode: node,
  });
  const minute = api.getCellValue({
    colKey: api.getColumn('minute') as Column,
    rowNode: node,
  });
  const day = api.getCellValue({
    colKey: api.getColumn('day') as Column,
    rowNode: node,
  });
  return !day && !minute && !month && !week;
};

export const isResetToDefaultHidden = (api: GridApi, node: IRowNode, entity: DialBaseEntity) => {
  const month = api.getCellValue({
    colKey: api.getColumn('month') as Column,
    rowNode: node,
  });
  const week = api.getCellValue({
    colKey: api.getColumn('week') as Column,
    rowNode: node,
  });
  const minute = api.getCellValue({
    colKey: api.getColumn('minute') as Column,
    rowNode: node,
  });
  const day = api.getCellValue({
    colKey: api.getColumn('day') as Column,
    rowNode: node,
  });

  const defaultDay = entity.defaultRoleLimit?.day;
  const defaultMinute = entity.defaultRoleLimit?.minute;
  const defaultWeek = entity.defaultRoleLimit?.week;
  const defaultMonth = entity.defaultRoleLimit?.month;

  return (
    (day === defaultDay && minute === defaultMinute && week === defaultWeek && month === defaultMonth) ||
    !defaultDay ||
    !defaultMinute ||
    !defaultWeek ||
    !defaultMonth
  );
};
