import { ColumnGroup, ColumnItem } from '@/src/components/Runs/Export/models';
import { ExportRunI18nKey } from '@/src/constants/i18n';

const BODY_COLUMNS = new Set(['requestBody', 'responseBody', 'extractionWarnings']);

export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

export enum ColumnGroupId {
  Identification = 'identification',
  Data = 'data',
  Response = 'response',
  Metrics = 'metrics',
  Body = 'body',
}

const GROUP_ORDER: ColumnGroupId[] = [
  ColumnGroupId.Identification,
  ColumnGroupId.Data,
  ColumnGroupId.Response,
  ColumnGroupId.Metrics,
  ColumnGroupId.Body,
];

export const GROUP_LABEL_KEY: Record<ColumnGroupId, ExportRunI18nKey> = {
  [ColumnGroupId.Identification]: ExportRunI18nKey.GroupIdentification,
  [ColumnGroupId.Data]: ExportRunI18nKey.GroupData,
  [ColumnGroupId.Response]: ExportRunI18nKey.GroupResponse,
  [ColumnGroupId.Metrics]: ExportRunI18nKey.GroupMetrics,
  [ColumnGroupId.Body]: ExportRunI18nKey.GroupBody,
};

function getGroupId(columnName: string): ColumnGroupId {
  if (BODY_COLUMNS.has(columnName)) return ColumnGroupId.Body;
  if (columnName.startsWith('data:')) return ColumnGroupId.Data;
  if (columnName.startsWith('response:')) return ColumnGroupId.Response;
  if (
    columnName.startsWith('metric:') ||
    columnName.startsWith('metricInfo:') ||
    columnName.startsWith('metricError:')
  ) {
    return ColumnGroupId.Metrics;
  }
  return ColumnGroupId.Identification;
}

function getDisplayName(columnName: string): string {
  const parts = columnName.split(':');
  if (parts.length >= 3) {
    return parts.slice(2).join(':');
  }
  if (parts.length === 2) {
    return parts[1];
  }
  return columnName;
}

function getMetricSubGroup(columnName: string): string | undefined {
  const parts = columnName.split(':');
  if (
    (columnName.startsWith('metric:') ||
      columnName.startsWith('metricInfo:') ||
      columnName.startsWith('metricError:')) &&
    parts.length >= 2
  ) {
    return parts[1];
  }
  return undefined;
}

export function groupColumns(columns: string[]): ColumnGroup[] {
  const groupMap = new Map<ColumnGroupId, ColumnItem[]>(GROUP_ORDER.map((id) => [id, []]));

  for (const columnName of columns) {
    const groupId = getGroupId(columnName);
    const isBodyColumn = groupId === ColumnGroupId.Body;
    const item: ColumnItem = {
      name: columnName,
      displayName: getDisplayName(columnName),
      defaultChecked: !isBodyColumn,
      subGroup: getMetricSubGroup(columnName),
    };
    groupMap.get(groupId)!.push(item);
  }

  return GROUP_ORDER.filter((id) => groupMap.get(id)!.length > 0).map((id) => ({
    id,
    columns: groupMap.get(id)!,
  }));
}

export function getCheckState(items: ColumnItem[], checkedColumns: Set<string>): CheckState {
  const total = items.length;
  const checked = items.filter((c) => checkedColumns.has(c.name)).length;
  if (checked === 0) return 'unchecked';
  if (checked === total) return 'checked';
  return 'indeterminate';
}
