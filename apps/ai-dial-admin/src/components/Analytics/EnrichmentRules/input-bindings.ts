import { EvaluatorVar } from '@/src/models/analytics/evaluator';
import { BindingRowError, InputBindingKind, InputBindingRow } from '@/src/models/analytics/enrichment-rules-ui';
import { InputBinding } from '@/src/models/analytics/rule';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

let counter = 0;
const nextRowId = (): string => `input-binding-${++counter}`;

export const createInputBindingRow = (): InputBindingRow => ({
  id: nextRowId(),
  var: '',
  kind: InputBindingKind.Column,
  value: '',
});

export const toInputBindingRows = (bindings?: InputBinding[]): InputBindingRow[] =>
  bindings?.length
    ? bindings.map((binding) => ({
        id: nextRowId(),
        var: binding.var,
        kind: binding.jsonata == null ? InputBindingKind.Column : InputBindingKind.Jsonata,
        value: binding.jsonata ?? binding.column ?? '',
      }))
    : [createInputBindingRow()];

export const toInputBindings = (rows: InputBindingRow[]): InputBinding[] =>
  rows
    .filter((row) => row.var && row.value)
    .map((row) =>
      row.kind === InputBindingKind.Jsonata
        ? { var: row.var, jsonata: row.value }
        : { var: row.var, column: row.value },
    );

export const getInputRowError = (
  row: InputBindingRow,
  columns: AnalyticsTableColumn[],
  vars: EvaluatorVar[],
): BindingRowError => ({
  isColumnUnavailable:
    row.kind === InputBindingKind.Column && Boolean(row.value) && !columns.some((c) => c.name === row.value),
  isVarUnavailable: Boolean(row.var) && !vars.some((v) => v.name === row.var),
  isTypeMismatch: false,
});

export const getTakenVars = (rows: InputBindingRow[], currentId: string): Set<string> =>
  new Set(rows.filter((row) => row.id !== currentId && row.var).map((row) => row.var));
