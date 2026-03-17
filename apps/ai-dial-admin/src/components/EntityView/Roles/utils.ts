import { ColDef, Column, GridApi, ICellRendererParams, IRowNode } from 'ag-grid-community';

import { RolesGridData } from '@/src/components/EntityView/Roles/models';
import EmptyCellRenderer from '@/src/components/Grid/CellRenderers/EmptyCellRenderer';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import { sharingTypes } from '@/src/components/Roles/constants';
import { ACTION_COLUMN, NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import {
  getOpenInNewTabOperation,
  getRemoveOperation,
  getResetOperation,
  getSetNoLimitsOperation,
} from '@/src/constants/grid-columns/actions';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { MenuI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { NO_LIMITS_KEY, UNLIMITED_VALUE } from '@/src/constants/role';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import { ApplicationRoute } from '@/src/types/routes';
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

      if (!limit?.enabled) return null;
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

const editableCellRendererSelector = (params: ICellRendererParams) => {
  const { type } = params.data || {};

  if (!type || (type !== MenuI18nKey.Routes && type !== MenuI18nKey.Toolsets)) {
    return { component: EditableCellRenderer };
  }

  return { component: EmptyCellRenderer };
};

const createLimitColumn = (
  headerName: string,
  field: keyof DialRoleLimits,
  defaultValues?: DialRoleLimits,
  onChange?: (value: number, data: DialRole, token: string) => void,
  otherFields: Array<keyof DialRoleLimits> = [],
  isReadOnlyAdmin?: boolean,
) => ({
  headerName,
  field,
  cellClass: NO_BORDER_CLASS,
  cellRendererSelector: editableCellRendererSelector,
  cellRendererParams: (params: { data?: DialRoleLimits }) => {
    const defaultValue = defaultValues?.[field];
    const hasOtherValue = otherFields.some((f) => params.data?.[f] && params.data?.[f] !== NO_LIMITS_KEY);
    const hasOtherDefaults = otherFields.some((f) => defaultValues?.[f] && params.data?.[f] !== NO_LIMITS_KEY);
    return {
      ...cellRenderParams,
      defaultValue,
      onChange: isReadOnlyAdmin ? undefined : onChange,
      showMaxValue:
        (hasOtherValue || hasOtherDefaults) && (!params.data?.[field] || params.data?.[field] === NO_LIMITS_KEY),
      isReadonly: isReadOnlyAdmin,
    };
  },
});

export const LIMIT_COLUMNS = (
  defaultValues?: DialRoleLimits,
  onChange?: (value: number, data: DialRole, token: string) => void,
  isReadOnlyAdmin?: boolean,
) => [
  createLimitColumn('Tokens per minute', 'minute', defaultValues, onChange, ['day', 'week', 'month'], isReadOnlyAdmin),
  createLimitColumn('Tokens per day', 'day', defaultValues, onChange, ['minute', 'week', 'month'], isReadOnlyAdmin),
  createLimitColumn('Tokens per week', 'week', defaultValues, onChange, ['minute', 'day', 'month'], isReadOnlyAdmin),
  createLimitColumn('Tokens per month', 'month', defaultValues, onChange, ['minute', 'day', 'week'], isReadOnlyAdmin),
];

export const integerValueFormatter = (v: string | number) => {
  if (v == null) return '';
  const s = String(v);
  if (s === '') return '';
  let digits = s.replace(/\D+/g, '');
  if (digits.length > 1) {
    digits = digits.replace(/^0+/, '');
    if (digits === '') return '0';
  }
  return digits;
};

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
      valueFormatter: integerValueFormatter,
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
      valueFormatter: integerValueFormatter,
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
  remove: ((entity?: DialRole) => void) | undefined,
  open: (entity?: DialRole) => void,
  resetToDefault: ((entity?: DialRole) => void) | undefined,
  setNoLimits: ((entity?: DialRole) => void) | undefined,
  resetToDefaultHidden: (api: GridApi, node: IRowNode) => boolean,
  isSetNoLimitsHidden: (api: GridApi, node: IRowNode) => boolean,
  view: ApplicationRoute,
  isReadOnlyAdmin?: boolean,
): ColDef[] => {
  const actions = [getOpenInNewTabOperation(open)];
  const colDefs = [...BASE_COLUMNS.slice(0, 3)];

  if (view !== ApplicationRoute.Routes && view !== ApplicationRoute.Toolsets) {
    if (resetToDefault) {
      actions.push(getResetOperation(resetToDefault, resetToDefaultHidden));
    }
    if (setNoLimits) {
      actions.push(getSetNoLimitsOperation(setNoLimits, isSetNoLimitsHidden));
    }
    colDefs.push(...LIMIT_COLUMNS({ ...entity.defaultRoleLimit }, onChangeLimits, isReadOnlyAdmin));
  }

  if (!entity.isPublic && remove) {
    actions.push(getRemoveOperation(remove));
  }

  return [...colDefs, ACTION_COLUMN(actions)];
};

export const isResetAvailable = (entity: EntityRoleLimits): boolean => {
  return (
    entity.roleLimits != null &&
    Object.values(entity.roleLimits).some((limit) => !isLimitSameAsDefault(limit, entity.defaultRoleLimit))
  );
};

export const isLimitSameAsDefault = (limit: DialRoleLimits, defaultLimit?: DialRoleLimits): boolean => {
  const limitKeys = Object.keys(limit ?? {}) as Array<keyof DialRoleLimits>;
  const defaultKeys = defaultLimit ? (Object.keys(defaultLimit) as Array<keyof DialRoleLimits>) : [];

  if (defaultLimit) {
    if (limitKeys.some((key) => !defaultKeys.includes(key as keyof DialRoleLimits))) {
      return false;
    }
  }

  for (const key of defaultKeys) {
    if (key in limit && limit[key] !== defaultLimit![key]) {
      return false;
    }
  }

  return true;
};

export const isSetNoLimitsHidden = (api: GridApi, node: IRowNode) => {
  if (node.data.type === MenuI18nKey.Routes || node.data.type === MenuI18nKey.Toolsets) {
    return true;
  }
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
  return day === UNLIMITED_VALUE && minute === UNLIMITED_VALUE && month === UNLIMITED_VALUE && week === UNLIMITED_VALUE;
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
