import { Pipeline } from '@/src/models/analytics/pipeline';
import { AnalyticsTable, TableStatus } from '@/src/models/analytics/table';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { AnalyticsExportEntityType } from '@/src/types/analytics/export';

// The service names every OTLP landing table `otel_<sink>_<signal>` and the table list carries no field that marks
// one, so the prefix is the only signal on the client. It mirrors a service rule: if that naming changes, an OTLP
// table shows up here again and the preview reports it.
const OTLP_LANDING_TABLE_PREFIX = 'otel_';

/**
 * The service refuses a system, pending, failed or OTLP landing table as an explicit selection and leaves each out
 * of a full export, so offering one would only produce a refusal or a Skipped row at preview.
 */
export const isExportableTable = (table: AnalyticsTable): boolean =>
  !table.system && table.status === TableStatus.Active && !table.name.startsWith(OTLP_LANDING_TABLE_PREFIX);

const toGridData = (
  { name, description }: { name: string; description?: string },
  type: AnalyticsExportEntityType,
): EntitiesGridData => ({ name, displayName: name, description, type });

export const getTablesForExportGrid = (tables: AnalyticsTable[]): EntitiesGridData[] =>
  tables.filter(isExportableTable).map((table) => toGridData(table, AnalyticsExportEntityType.TABLE));

export const getPipelinesForExportGrid = (pipelines: Pipeline[]): EntitiesGridData[] =>
  pipelines.map((pipeline) => toGridData(pipeline, AnalyticsExportEntityType.PIPELINE));
