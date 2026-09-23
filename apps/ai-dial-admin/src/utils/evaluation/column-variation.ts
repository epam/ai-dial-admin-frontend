import { ColDef } from 'ag-grid-community';

import { ResultDto } from '@/src/models/evaluation/run';

/**
 * The run-position columns of the `Execution` group. `HTTP` and `Duration` are deliberately absent:
 * an all-`200` run is a reading worth showing, not a column with nothing to say.
 */
export enum ExecutionIndexField {
  RunIndex = 'runIndex',
  RequestIndex = 'requestIndex',
  TotalRequests = 'totalRequests',
  TurnIndex = 'turnIndex',
  TotalTurns = 'totalTurns',
}

const EXECUTION_INDEX_FIELDS: ExecutionIndexField[] = Object.values(ExecutionIndexField);

/**
 * `undefined` is normalised to `null` so that a field absent from every result collapses to a single
 * distinct value — which is what makes a single-turn run hide `Turn` and `Total turns` rather than
 * showing two empty columns.
 */
const isUniformField = (results: ResultDto[], field: ExecutionIndexField): boolean =>
  new Set(results.map((result) => result[field] ?? null)).size <= 1;

/**
 * An empty result set reports nothing uniform, so the pre-fetch column build keeps the full set and the
 * grid does not mount narrow and then widen once results arrive.
 */
export const getUniformExecutionFields = (results: ResultDto[]): Set<string> =>
  results.length === 0
    ? new Set<string>()
    : new Set<string>(EXECUTION_INDEX_FIELDS.filter((field) => isUniformField(results, field)));

/** Only ever hides: a column a builder already hid stays hidden, whatever its values do. */
export const hideUniformColumns = (columns: ColDef[], uniformFields: Set<string>): ColDef[] =>
  columns.map((column) =>
    uniformFields.has((column.colId ?? column.field) as string) ? { ...column, hide: true } : column,
  );
