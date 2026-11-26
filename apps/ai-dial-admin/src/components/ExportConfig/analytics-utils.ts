import { TabItem, TabStatus } from '@epam/ai-dial-ui-kit';
import { ColDef, GridOptions, RowClassParams } from 'ag-grid-community';

import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getEditOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { DESCRIPTION_COLUMN, DISPLAY_NAME_COLUMN_WITH_SORT } from '@/src/constants/grid-columns/base-columns';
import { ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { AnalyticsExportAccessRow, AnalyticsExportPreviewRows } from '@/src/components/ExportConfig/Preview/models';
import {
  CatalogExportAccessItem,
  CatalogExportComponent,
  CatalogExportPreview,
  CatalogExportRequest,
  CatalogLeftBehindItem,
} from '@/src/models/analytics/catalog-export';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportType } from '@/src/types/export';
import { getTabStatusProps } from '@/src/utils/tabs/utils';
import {
  AnalyticsExportEntityType,
  AnalyticsExportPreviewTab,
  CatalogComponentType,
} from '@/src/types/analytics/export';

export const ANALYTICS_ENTITY_TABS: { id: AnalyticsExportEntityType; labelKey: string }[] = [
  { id: AnalyticsExportEntityType.TABLE, labelKey: MenuI18nKey.Tables },
  { id: AnalyticsExportEntityType.PIPELINE, labelKey: MenuI18nKey.Pipelines },
];

const TAB_TO_COMPONENT_TYPE: Record<AnalyticsExportEntityType, CatalogComponentType> = {
  [AnalyticsExportEntityType.TABLE]: CatalogComponentType.TABLE,
  [AnalyticsExportEntityType.PIPELINE]: CatalogComponentType.PIPELINE,
};

const ANALYTICS_TAB_IDS = new Set<string>(Object.values(AnalyticsExportEntityType));

export const getAnalyticsTabs = (t: (v: string) => string): TabItem[] =>
  ANALYTICS_ENTITY_TABS.map(({ id, labelKey }) => ({ id, label: t(labelKey) }));

const getPipelineOptionColumns = (t: (v: string) => string): ColDef<EntitiesGridData>[] => [
  {
    colId: 'dependencies',
    headerName: t(ExportI18nKey.AnalyticsDependencies),
    valueGetter: ({ data }) =>
      t(data?.isExportedAlone ? ExportI18nKey.AnalyticsPipelineOnly : ExportI18nKey.AnalyticsDependenciesIncluded),
  },
];

const getTableOptionColumns = (t: (v: string) => string): ColDef<EntitiesGridData>[] => [
  {
    colId: 'export',
    headerName: t(ExportI18nKey.AnalyticsExportColumn),
    valueGetter: ({ data }) =>
      t(data?.isAccessOnly ? ExportI18nKey.AnalyticsAccessOnly : ExportI18nKey.AnalyticsTableAndAccess),
  },
  {
    colId: 'roles',
    headerName: t(ExportI18nKey.AnalyticsRoles),
    valueGetter: ({ data }) =>
      data?.accessRoles?.length ? data.accessRoles.join(', ') : t(ExportI18nKey.AnalyticsAllRolesValue),
  },
];

export const hasAnalyticsRowOptions = (tab: string, isAccessIncluded: boolean): boolean =>
  tab === AnalyticsExportEntityType.PIPELINE || (tab === AnalyticsExportEntityType.TABLE && isAccessIncluded);

export const getAnalyticsColDefs = (
  t: (v: string) => string,
  tab: string,
  isAccessIncluded: boolean,
  remove?: (entity?: EntitiesGridData) => void,
  edit?: (entity?: EntitiesGridData) => void,
): ColDef[] => {
  const columns = [DISPLAY_NAME_COLUMN_WITH_SORT, DESCRIPTION_COLUMN];
  if (!remove) {
    return columns;
  }
  if (!edit || !hasAnalyticsRowOptions(tab, isAccessIncluded)) {
    return [...columns, ACTION_COLUMN([getRemoveOperation(remove)])];
  }
  const optionColumns =
    tab === AnalyticsExportEntityType.PIPELINE ? getPipelineOptionColumns(t) : getTableOptionColumns(t);
  return [
    ...columns,
    ...(optionColumns as ColDef[]),
    ACTION_COLUMN([getEditOperation(edit), getRemoveOperation(remove)]),
  ];
};

const toCatalogComponent = (type: CatalogComponentType, entity: EntitiesGridData): CatalogExportComponent => ({
  type,
  name: entity.name || '',
  ...(type === CatalogComponentType.PIPELINE && entity.isExportedAlone && { dependencies: false as const }),
  ...(type === CatalogComponentType.TABLE && entity.isAccessOnly && { access_only: true as const }),
  ...(type === CatalogComponentType.TABLE && !!entity.accessRoles?.length && { roles: entity.accessRoles }),
});

/** The service reads an empty selection as "everything exportable"; it has no separate full-export flag. */
export const buildCatalogExportRequest = (
  exportType: ExportType,
  customExportData: Record<string, EntitiesGridData[]>,
  isAccessIncluded = false,
): CatalogExportRequest => {
  const access = isAccessIncluded ? { include_access: true as const } : {};
  if (exportType === ExportType.Full) {
    return { components: [], ...access };
  }
  return {
    ...access,
    components: Object.entries(customExportData)
      .filter(([tab]) => ANALYTICS_TAB_IDS.has(tab))
      .flatMap(([tab, entities]) =>
        entities.map((entity) => toCatalogComponent(TAB_TO_COMPONENT_TYPE[tab as AnalyticsExportEntityType], entity)),
      ),
  };
};

const PREVIEW_TABS: { id: AnalyticsExportPreviewTab; labelKey: string }[] = [
  { id: AnalyticsExportPreviewTab.OBJECTS, labelKey: ExportI18nKey.AnalyticsObjects },
  { id: AnalyticsExportPreviewTab.REQUIRED_SYSTEM_TABLES, labelKey: ExportI18nKey.AnalyticsRequiredSystemTables },
  { id: AnalyticsExportPreviewTab.SKIPPED, labelKey: ExportI18nKey.AnalyticsSkipped },
  { id: AnalyticsExportPreviewTab.ACCESS, labelKey: ExportI18nKey.AnalyticsAccess },
];

const getAccessTab = (t: (v: string) => string, rows: AnalyticsExportAccessRow[]): TabItem => ({
  id: AnalyticsExportPreviewTab.ACCESS,
  label: `${t(ExportI18nKey.AnalyticsAccess)} (${rows.length})`,
  ...getTabStatusProps(t, rows.some((row) => row.isWarning) ? TabStatus.Warning : undefined),
});

export const getAnalyticsPreviewTabs = (t: (v: string) => string, rows?: AnalyticsExportPreviewRows): TabItem[] =>
  PREVIEW_TABS.flatMap(({ id, labelKey }) => {
    if (id !== AnalyticsExportPreviewTab.ACCESS) {
      return [{ id, label: t(labelKey) }];
    }
    const accessRows = rows?.[AnalyticsExportPreviewTab.ACCESS] as AnalyticsExportAccessRow[] | undefined;
    return accessRows ? [getAccessTab(t, accessRows)] : [];
  });

const PREVIEW_COLUMN_KEYS: Record<AnalyticsExportPreviewTab, { field: string; labelKey: string }[]> = {
  [AnalyticsExportPreviewTab.OBJECTS]: [
    { field: 'type', labelKey: ExportI18nKey.AnalyticsType },
    { field: 'name', labelKey: ExportI18nKey.AnalyticsName },
    { field: 'description', labelKey: ExportI18nKey.AnalyticsDescription },
    { field: 'reason', labelKey: ExportI18nKey.AnalyticsReason },
  ],
  [AnalyticsExportPreviewTab.REQUIRED_SYSTEM_TABLES]: [
    { field: 'name', labelKey: ExportI18nKey.AnalyticsName },
    { field: 'reason', labelKey: ExportI18nKey.AnalyticsReason },
  ],
  [AnalyticsExportPreviewTab.SKIPPED]: [
    { field: 'type', labelKey: ExportI18nKey.AnalyticsType },
    { field: 'name', labelKey: ExportI18nKey.AnalyticsName },
    { field: 'reason', labelKey: ExportI18nKey.AnalyticsReason },
  ],
  [AnalyticsExportPreviewTab.ACCESS]: [
    { field: 'table', labelKey: ExportI18nKey.AnalyticsTable },
    { field: 'role', labelKey: ExportI18nKey.AnalyticsRole },
    { field: 'outcome', labelKey: ExportI18nKey.AnalyticsOutcome },
    { field: 'detail', labelKey: ExportI18nKey.AnalyticsDetail },
  ],
};

export const getAnalyticsPreviewColDefs = (t: (v: string) => string, tab: AnalyticsExportPreviewTab): ColDef[] =>
  PREVIEW_COLUMN_KEYS[tab].map(({ field, labelKey }) => ({ field, colId: field, headerName: t(labelKey) }));

const getLeftBehindDetail = ({ entry, error }: CatalogLeftBehindItem, t: (v: string) => string): string => {
  const parts = [
    ...entry.privileges,
    ...(entry.rows ? [t(ExportI18nKey.AnalyticsRowPolicy)] : []),
    ...(entry.columns ? [t(ExportI18nKey.AnalyticsColumnPolicy)] : []),
  ];
  return parts.length ? `${error}: ${parts.join(', ')}` : error;
};

const toAccessRows = (item: CatalogExportAccessItem, t: (v: string) => string): AnalyticsExportAccessRow[] => [
  ...(item.roles ?? []).map((role) => ({
    table: item.table,
    role,
    outcome: t(ExportI18nKey.AnalyticsAccessExported),
    isWarning: false,
  })),
  ...(item.left_behind ?? []).map((leftBehind) => ({
    table: item.table,
    role: leftBehind.role,
    outcome: t(ExportI18nKey.AnalyticsAccessLeftBehind),
    detail: getLeftBehindDetail(leftBehind, t),
    isWarning: true,
  })),
];

export const getAnalyticsPreviewRows = (
  preview: CatalogExportPreview,
  t: (v: string) => string,
): AnalyticsExportPreviewRows => ({
  [AnalyticsExportPreviewTab.OBJECTS]: preview.objects ?? [],
  [AnalyticsExportPreviewTab.REQUIRED_SYSTEM_TABLES]: preview.required_system_tables ?? [],
  [AnalyticsExportPreviewTab.SKIPPED]: preview.skipped ?? [],
  ...(preview.access && {
    [AnalyticsExportPreviewTab.ACCESS]: preview.access.flatMap((item) => toAccessRows(item, t)),
  }),
});

export const ANALYTICS_EXPORT_PREVIEW_GRID_OPTIONS: GridOptions = {
  getRowClass: (params: RowClassParams) =>
    (params.data as Partial<AnalyticsExportAccessRow> | undefined)?.isWarning ? 'ag-warning-row' : void 0,
};
