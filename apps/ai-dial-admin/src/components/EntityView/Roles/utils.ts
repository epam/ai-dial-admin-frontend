import { ColDef, Column, GridApi, IRowNode } from 'ag-grid-community';

import { RolesGridData } from '@/src/components/EntityView/Roles/models';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import { sharingTypes } from '@/src/components/Roles/constants';
import { ACTION_COLUMN, NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import {
  getOpenInNewTabOperation,
  getRemoveOperation,
  getResetOperation,
  getSetNoLimitsOperation,
} from '@/src/constants/grid-columns/actions';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { RolesI18nKey } from '@/src/constants/i18n';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import { ApplicationRoute } from '@/src/types/routes';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { cellRenderParams } from './constants';

export const getNoAvailableTitle = (view: ApplicationRoute) => {
  if (view === ApplicationRoute.Models) return RolesI18nKey.NotAvailableModel;
  if (view === ApplicationRoute.Applications) return RolesI18nKey.NotAvailableApplication;
  return RolesI18nKey.NotAvailableToolSet;
};

export const isDisableRole = (entity: EntityRoleLimits) => {
  return !Object.keys(entity.roleLimits || {}).length && !entity.isPublic;
};

export const getRolesGridData = (entity: EntityRoleLimits, roles: DialRole[]): RolesGridData[] => {
  if (entity.isPublic) {
    return getAllRolesWithLimits(roles, entity);
  }

  return getRolesWithLimits(roles, entity);
};

const getAllRolesWithLimits = (roles: DialRole[], entity?: EntityRoleLimits) => {
  return roles.map((role) => {
    const limit = entity?.roleLimits?.[role.name || ''];
    return mapRoleData(role, limit, entity);
  });
};

const getRolesWithLimits = (roles: DialRole[], entity?: EntityRoleLimits) => {
  if (!entity?.roleLimits) return [];

  return Object.keys(entity.roleLimits)
    .map((roleName) => {
      const role = roles.find((role) => role.name === roleName);
      if (!role) return null;

      const limit = entity?.roleLimits?.[roleName];
      return mapRoleData(role, limit, entity);
    })
    .filter((data) => data !== null);
};

const getLimitData = (value?: string | null, defaultValue?: string | null) => {
  return value === null && defaultValue !== null ? null : value || defaultValue;
};

const mapRoleData = (
  role: DialRole,
  limit: DialRoleLimits | undefined,
  entity: EntityRoleLimits | undefined,
): RolesGridData => ({
  ...role,
  day: getLimitData(limit?.day, entity?.defaultRoleLimit?.day),
  minute: getLimitData(limit?.minute, entity?.defaultRoleLimit?.minute),
  week: getLimitData(limit?.week, entity?.defaultRoleLimit?.week),
  month: getLimitData(limit?.month, entity?.defaultRoleLimit?.month),
});

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
];

export const SHARING_COLUMNS = (
  t: (stringToTranslate: string) => string,
  onChange?: (value: number, data: DialRole, token: string) => void,
  getDefaultPlaceholder?: (node: IRowNode, colDef: ColDef) => string,
): ColDef[] => [
  {
    headerName: 'Type',
    field: 'name',
    filter: false,
    floatingFilter: false,
    valueFormatter: ({ value }) => formatType(value, t),
    tooltipValueGetter: ({ value }) => formatType(value, t),
  },
  {
    headerName: 'Expiration time (hours)',
    field: 'invitationTtl',
    filter: false,
    floatingFilter: false,
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      defaultValue: '',
      ...cellRenderParams,
      getDefaultPlaceholder,
      onChange,
      valueFormatter: (v: string) => v,
    },
  },
  {
    headerName: 'Max users',
    field: 'maxAcceptedUsers',
    filter: false,
    floatingFilter: false,
    cellClass: NO_BORDER_CLASS,
    cellRenderer: EditableCellRenderer,
    cellRendererParams: {
      defaultValue: '',
      ...cellRenderParams,
      getDefaultPlaceholder,
      onChange,
      valueFormatter: (v: string) => v,
    },
  },
];

const formatType = (value: string, t: (stringToTranslate: string) => string) => {
  const typeFieldKey = sharingTypes[value as keyof typeof sharingTypes];
  if (typeFieldKey) {
    return t(typeFieldKey);
  }

  return value;
};

export const getRolesColumnDefs = (
  entity: EntityRoleLimits,
  onChangeLimits: ((value: number, data: DialRole, token: string) => void) | undefined,
  remove: (entity?: DialRole) => void,
  open: (entity?: DialRole) => void,
  resetToDefault: (entity?: DialRole) => void,
  setNoLimits: (entity?: DialRole) => void,
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
    colDefs.push(...LIMIT_COLUMNS({ ...entity.defaultRoleLimit }, onChangeLimits));
  }

  if (!entity.isPublic) {
    actions.push(getRemoveOperation(remove));
  }

  return [...colDefs, ACTION_COLUMN(actions)];
};

export const isResetAvailable = (entity: EntityRoleLimits): boolean => {
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

export const isResetToDefaultHidden = (api: GridApi, node: IRowNode, entity: EntityRoleLimits) => {
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

  return day === defaultDay && minute === defaultMinute && week === defaultWeek && month === defaultMonth;
};
