import { TabModel } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { DESCRIPTION_COLUMN, DISPLAY_NAME_COLUMN_WITH_SORT } from '@/src/constants/grid-columns/base-columns';
import { ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { CatalogExportPreview, CatalogExportRequest } from '@/src/models/analytics/catalog-export';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportType } from '@/src/types/export';
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

export const getAnalyticsTabs = (t: (v: string) => string): TabModel[] =>
  ANALYTICS_ENTITY_TABS.map(({ id, labelKey }) => ({ id, label: t(labelKey) }));

export const getAnalyticsColDefs = (remove?: (entity?: EntitiesGridData) => void): ColDef[] => {
  const columns = [DISPLAY_NAME_COLUMN_WITH_SORT, DESCRIPTION_COLUMN];
  return remove ? [...columns, ACTION_COLUMN([getRemoveOperation(remove)])] : columns;
};

/** The service reads an empty selection as "everything exportable"; it has no separate full-export flag. */
export const buildCatalogExportRequest = (
  exportType: ExportType,
  customExportData: Record<string, EntitiesGridData[]>,
): CatalogExportRequest => {
  if (exportType === ExportType.Full) {
    return { components: [] };
  }
  return {
    components: Object.entries(customExportData)
      .filter(([tab]) => ANALYTICS_TAB_IDS.has(tab))
      .flatMap(([tab, entities]) =>
        entities.map((entity) => ({
          type: TAB_TO_COMPONENT_TYPE[tab as AnalyticsExportEntityType],
          name: entity.name || '',
        })),
      ),
  };
};

const PREVIEW_TABS: { id: AnalyticsExportPreviewTab; labelKey: string }[] = [
  { id: AnalyticsExportPreviewTab.OBJECTS, labelKey: ExportI18nKey.AnalyticsObjects },
  { id: AnalyticsExportPreviewTab.REQUIRED_SYSTEM_TABLES, labelKey: ExportI18nKey.AnalyticsRequiredSystemTables },
  { id: AnalyticsExportPreviewTab.SKIPPED, labelKey: ExportI18nKey.AnalyticsSkipped },
];

export const getAnalyticsPreviewTabs = (t: (v: string) => string): TabModel[] =>
  PREVIEW_TABS.map(({ id, labelKey }) => ({ id, label: t(labelKey) }));

const PREVIEW_COLUMN_KEYS: Record<AnalyticsExportPreviewTab, { field: string; labelKey: string }[]> = {
  [AnalyticsExportPreviewTab.OBJECTS]: [
    { field: 'type', labelKey: ExportI18nKey.AnalyticsType },
    { field: 'name', labelKey: ExportI18nKey.AnalyticsName },
    { field: 'description', labelKey: ExportI18nKey.AnalyticsDescription },
    { field: 'reason', labelKey: ExportI18nKey.AnalyticsReason },
  ],
  [AnalyticsExportPreviewTab.REQUIRED_SYSTEM_TABLES]: [{ field: 'name', labelKey: ExportI18nKey.AnalyticsName }],
  [AnalyticsExportPreviewTab.SKIPPED]: [
    { field: 'type', labelKey: ExportI18nKey.AnalyticsType },
    { field: 'name', labelKey: ExportI18nKey.AnalyticsName },
    { field: 'reason', labelKey: ExportI18nKey.AnalyticsReason },
  ],
};

export const getAnalyticsPreviewColDefs = (t: (v: string) => string, tab: AnalyticsExportPreviewTab): ColDef[] =>
  PREVIEW_COLUMN_KEYS[tab].map(({ field, labelKey }) => ({ field, colId: field, headerName: t(labelKey) }));

/** The service's `reason` strings are shown as returned: it composes them from object names. */
export const getAnalyticsPreviewRows = (
  preview: CatalogExportPreview,
): Record<AnalyticsExportPreviewTab, object[]> => ({
  [AnalyticsExportPreviewTab.OBJECTS]: preview.objects ?? [],
  [AnalyticsExportPreviewTab.REQUIRED_SYSTEM_TABLES]: preview.required_system_tables ?? [],
  [AnalyticsExportPreviewTab.SKIPPED]: preview.skipped ?? [],
});
