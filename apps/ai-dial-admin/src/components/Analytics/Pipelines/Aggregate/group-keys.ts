import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { GroupKey, TruncUnit } from '@/src/models/analytics/pipeline';
import { GroupKeyKind, GroupKeyRow } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';
const UNIT_TYPES: Record<TruncUnit, AnalyticsFieldType[]> = {
  [TruncUnit.Hour]: [AnalyticsFieldType.Timestamp],
  [TruncUnit.Day]: [AnalyticsFieldType.Date, AnalyticsFieldType.Timestamp],
  [TruncUnit.Week]: [AnalyticsFieldType.Date, AnalyticsFieldType.Timestamp],
  [TruncUnit.Month]: [AnalyticsFieldType.Date, AnalyticsFieldType.Timestamp],
};
export const getTruncUnits = (columns: AnalyticsTableColumn[], column?: string): TruncUnit[] => {
  const type = columns.find((candidate) => candidate.name === column)?.type;
  if (!type) return [];
  return Object.values(TruncUnit).filter((unit) => UNIT_TYPES[unit].includes(type));
};
export const isTruncatable = (columns: AnalyticsTableColumn[], column?: string): boolean =>
  getTruncUnits(columns, column).length > 0;
export const createGroupKeyRow = (): GroupKeyRow => ({
  id: crypto.randomUUID(),
  kind: GroupKeyKind.Column,
  column: '',
});
export const toGroupKeyRows = (keys?: GroupKey[]): GroupKeyRow[] =>
  (keys ?? []).map((key) => ({
    id: crypto.randomUUID(),
    kind: key.trunc ? GroupKeyKind.Trunc : GroupKeyKind.Column,
    column: key.trunc?.column ?? key.column ?? '',
    unit: key.trunc?.unit,
    as: key.as,
  }));
export const toGroupKeys = (rows: GroupKeyRow[]): GroupKey[] =>
  rows
    .filter((row) => row.column && (row.kind === GroupKeyKind.Column || row.unit))
    .map((row) => ({
      ...(row.kind === GroupKeyKind.Trunc
        ? { trunc: { column: row.column, unit: row.unit as TruncUnit } }
        : { column: row.column }),
      ...(row.as ? { as: row.as } : {}),
    }));
export const getGroupKeyOutputName = (row: GroupKeyRow): string => row.as || row.column;
