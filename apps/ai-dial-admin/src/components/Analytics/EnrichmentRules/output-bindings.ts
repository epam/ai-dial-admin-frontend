import { EvaluatorVar } from '@/src/models/analytics/evaluator';
import { BindingRowError, OutputBindingRow } from '@/src/models/analytics/enrichment-rules-ui';
import { OutputBinding } from '@/src/models/analytics/rule';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';
import { isTypeMismatch } from '@/src/utils/analytics/type-compatibility';

let counter = 0;
const nextBindingId = (): string => `binding-${++counter}`;

export const createBindingRow = (): OutputBindingRow => ({ id: nextBindingId(), column: '', var: '' });

// A rule with no bindings still opens on one empty row to edit.
export const toBindingRows = (bindings?: OutputBinding[]): OutputBindingRow[] =>
  bindings?.length
    ? bindings.map(({ column, var: varName }) => ({ id: nextBindingId(), column, var: varName }))
    : [createBindingRow()];

export const getBindingRowError = (
  row: OutputBindingRow,
  columns: AnalyticsTableColumn[],
  vars: EvaluatorVar[],
): BindingRowError => {
  const column = columns.find((c) => c.name === row.column);
  const variable = vars.find((v) => v.name === row.var);

  return {
    isColumnUnavailable: Boolean(row.column) && !column,
    isVarUnavailable: Boolean(row.var) && !variable,
    isTypeMismatch: Boolean(column && variable) && isTypeMismatch(column?.type, variable?.type),
  };
};

export const hasBlockingBindingError = (error: BindingRowError): boolean =>
  error.isColumnUnavailable || error.isVarUnavailable;

export const getTakenElsewhere = (rows: OutputBindingRow[], currentId: string, key: 'column' | 'var'): Set<string> =>
  new Set(rows.filter((row) => row.id !== currentId && row[key]).map((row) => row[key]));

export const toOutputBindings = (rows: OutputBindingRow[]): OutputBinding[] =>
  rows.filter((row) => row.column && row.var).map(({ column, var: varName }) => ({ column, var: varName }));
