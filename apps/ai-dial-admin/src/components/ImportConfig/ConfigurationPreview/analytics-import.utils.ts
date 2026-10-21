import { TabModel } from '@epam/ai-dial-ui-kit';
import { ColDef, GridApi, GridOptions, ICellRendererParams, IRowNode, RowClassParams } from 'ag-grid-community';

import {
  getActionClassName,
  getComponentActionColumn,
} from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils';
import { AnalyticsImportRow } from '@/src/components/ImportConfig/ConfigurationPreview/models';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getCompareChangesOperation } from '@/src/constants/grid-columns/actions';
import { BasicI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { CatalogImportEntry, CatalogImportPreview, CatalogImportResult } from '@/src/models/analytics/catalog-import';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { AnalyticsImportPreviewTab, CatalogImportAction, CatalogImportStatus } from '@/src/types/analytics/import';
import { ImportConfigurationAction } from '@/src/types/import';

const TAB_LABEL_KEYS: Record<AnalyticsImportPreviewTab, string> = {
  [AnalyticsImportPreviewTab.TABLES]: ImportI18nKey.AnalyticsTables,
  [AnalyticsImportPreviewTab.PIPELINES]: ImportI18nKey.AnalyticsPipelines,
  [AnalyticsImportPreviewTab.REQUIRED_SYSTEM_TABLES]: ImportI18nKey.AnalyticsRequiredSystemTables,
};

export const ANALYTICS_IMPORT_TAB_RESOURCE: Record<AnalyticsImportPreviewTab, ActivityAuditResourceType> = {
  [AnalyticsImportPreviewTab.TABLES]: ActivityAuditResourceType.TABLE,
  [AnalyticsImportPreviewTab.PIPELINES]: ActivityAuditResourceType.PIPELINE,
  [AnalyticsImportPreviewTab.REQUIRED_SYSTEM_TABLES]: ActivityAuditResourceType.TABLE,
};

// Create and Skip reuse the admin action column's title-case values and its styling; Fail is styled here.
const FAIL_ACTION_LABEL = 'Fail';

const ACTION_LABELS: Record<CatalogImportAction, string> = {
  [CatalogImportAction.CREATE]: ImportConfigurationAction.CREATE,
  [CatalogImportAction.SKIP]: ImportConfigurationAction.SKIP,
  [CatalogImportAction.FAIL]: FAIL_ACTION_LABEL,
};

const STATUS_LABEL_KEYS: Record<CatalogImportStatus, string> = {
  [CatalogImportStatus.CREATED]: ImportI18nKey.AnalyticsStatusCreated,
  [CatalogImportStatus.SKIPPED]: ImportI18nKey.AnalyticsStatusSkipped,
  [CatalogImportStatus.ROLLED_BACK]: ImportI18nKey.AnalyticsStatusRolledBack,
  [CatalogImportStatus.ROLLBACK_FAILED]: ImportI18nKey.AnalyticsStatusRollbackFailed,
  [CatalogImportStatus.FAILED]: ImportI18nKey.AnalyticsStatusFailed,
};

const getEntries = (
  source: CatalogImportPreview | CatalogImportResult,
): Record<AnalyticsImportPreviewTab, CatalogImportEntry[]> => ({
  [AnalyticsImportPreviewTab.TABLES]: source.tables ?? [],
  [AnalyticsImportPreviewTab.PIPELINES]: source.pipelines ?? [],
  [AnalyticsImportPreviewTab.REQUIRED_SYSTEM_TABLES]: source.required_system_tables ?? [],
});

const getDiffersLabel = (entry: CatalogImportEntry, t: (key: string) => string): string | undefined => {
  if (entry.metadata_only) return t(ImportI18nKey.AnalyticsMetadataOnly);
  if (entry.differs) return t(ImportI18nKey.AnalyticsDiffers);
  return void 0;
};

const getCanEnableLabel = (entry: CatalogImportEntry, t: (key: string) => string): string | undefined => {
  if (entry.armable == null) return void 0;
  const label = t(entry.armable ? BasicI18nKey.Yes : BasicI18nKey.No);
  return entry.arm_problems?.length ? `${label}: ${entry.arm_problems.join('; ')}` : label;
};

const getStatusLabel = (entry: CatalogImportEntry, t: (key: string) => string): string | undefined => {
  if (!entry.status) return void 0;
  const key = STATUS_LABEL_KEYS[entry.status];
  return key ? t(key) : entry.status;
};

const toRow = (entry: CatalogImportEntry, t: (key: string) => string): AnalyticsImportRow => ({
  name: entry.name,
  action: ACTION_LABELS[entry.import_action] ?? entry.import_action,
  problems: (entry.problems ?? []).join('; '),
  canEnable: getCanEnableLabel(entry, t),
  differs: getDiffersLabel(entry, t),
  status: getStatusLabel(entry, t),
  isInvalid: entry.import_action === CatalogImportAction.FAIL || !!entry.problems?.length,
  entry,
});

export const getAnalyticsImportRows = (
  source: CatalogImportPreview | CatalogImportResult,
  t: (key: string) => string,
): Record<AnalyticsImportPreviewTab, AnalyticsImportRow[]> => {
  const entries = getEntries(source);
  return {
    [AnalyticsImportPreviewTab.TABLES]: entries[AnalyticsImportPreviewTab.TABLES].map((e) => toRow(e, t)),
    [AnalyticsImportPreviewTab.PIPELINES]: entries[AnalyticsImportPreviewTab.PIPELINES].map((e) => toRow(e, t)),
    [AnalyticsImportPreviewTab.REQUIRED_SYSTEM_TABLES]: entries[AnalyticsImportPreviewTab.REQUIRED_SYSTEM_TABLES].map(
      (e) => toRow(e, t),
    ),
  };
};

export const getAnalyticsImportTabs = (
  rows: Record<AnalyticsImportPreviewTab, AnalyticsImportRow[]>,
  t: (key: string) => string,
): TabModel[] =>
  Object.values(AnalyticsImportPreviewTab).map((id) => ({
    id,
    label: t(TAB_LABEL_KEYS[id]),
    invalid: rows[id].some((row) => row.isInvalid),
  }));

const column = (field: string, headerName: string): ColDef => ({ field, colId: field, headerName });

const ACTION_COLUMN_DEF: ColDef = {
  ...getComponentActionColumn(),
  cellRendererParams: (params: ICellRendererParams) => ({
    statusClassName: params.value === FAIL_ACTION_LABEL ? 'bg-control-error' : getActionClassName(params.value),
  }),
};

export const getAnalyticsImportColDefs = (
  tab: AnalyticsImportPreviewTab,
  t: (key: string) => string,
  onCompare: (row?: AnalyticsImportRow) => void,
  hasResult: boolean,
): ColDef[] => {
  const columns: ColDef[] = [
    ACTION_COLUMN_DEF,
    column('name', t(ImportI18nKey.AnalyticsName)),
    column('problems', t(ImportI18nKey.AnalyticsProblems)),
  ];
  if (tab === AnalyticsImportPreviewTab.PIPELINES) {
    columns.push(column('canEnable', t(ImportI18nKey.AnalyticsCanEnable)));
  }
  if (tab !== AnalyticsImportPreviewTab.REQUIRED_SYSTEM_TABLES) {
    columns.push(column('differs', t(ImportI18nKey.AnalyticsDiffers)));
  }
  if (hasResult) {
    columns.push(column('status', t(ImportI18nKey.AnalyticsStatus)));
  }
  // Compare needs an existing object to compare against; a row the import would create has none.
  const compare = {
    ...getCompareChangesOperation(onCompare),
    hidden: (_: GridApi, node: IRowNode) => !(node.data as AnalyticsImportRow | undefined)?.entry.prev,
  };
  return [...columns, ACTION_COLUMN([compare])];
};

export const ANALYTICS_IMPORT_GRID_OPTIONS: GridOptions = {
  getRowClass: (params: RowClassParams) =>
    (params.data as AnalyticsImportRow | undefined)?.isInvalid ? 'ag-error-row' : void 0,
};

export const isAnalyticsImportBlocked = (
  preview: CatalogImportPreview | undefined,
  isReusedNamesAcknowledged: boolean,
): boolean => {
  if (!preview) return true;
  if (preview.validation_errors?.length) return true;
  const entries = Object.values(getEntries(preview)).flat();
  if (entries.some((entry) => entry.import_action === CatalogImportAction.FAIL)) return true;
  return entries.some((entry) => entry.reused_name) && !isReusedNamesAcknowledged;
};

export const getReusedNames = (preview: CatalogImportPreview | undefined): string[] =>
  preview
    ? Object.values(getEntries(preview))
        .flat()
        .filter((e) => e.reused_name)
        .map((e) => e.name)
    : [];

export const hasFailRow = (preview: CatalogImportPreview | undefined): boolean =>
  !!preview &&
  Object.values(getEntries(preview))
    .flat()
    .some((e) => e.import_action === CatalogImportAction.FAIL);
