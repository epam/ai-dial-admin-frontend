import { PipelineVar } from '@/src/models/analytics/pipeline';
import { VarBindingKind, VarRow } from '@/src/models/analytics/pipeline-ui';

let counter = 0;
const nextRowId = (): string => `var-${++counter}`;

export const createVarRow = (): VarRow => ({
  id: nextRowId(),
  name: '',
  kind: VarBindingKind.Column,
  column: '',
  jsonata: '',
});

// A stored spec carries exactly one of the two, so which one it carries is the selection.
export const toVarRows = (vars?: Record<string, PipelineVar>): VarRow[] =>
  Object.entries(vars ?? {}).map(([name, spec]) => ({
    id: nextRowId(),
    name,
    kind: spec?.jsonata ? VarBindingKind.Jsonata : VarBindingKind.Column,
    column: spec?.column ?? '',
    jsonata: spec?.jsonata ?? '',
  }));

// Keyed by name on the wire, carrying only the member the row selects: the service refuses a spec that
// declares both, and a row still being filled in is left out rather than sent to be refused.
export const toVars = (rows: VarRow[]): Record<string, PipelineVar> =>
  rows.reduce<Record<string, PipelineVar>>((vars, row) => {
    if (!row.name) return vars;

    if (row.kind === VarBindingKind.Jsonata) {
      if (row.jsonata) vars[row.name] = { jsonata: row.jsonata };
      return vars;
    }

    if (row.column) vars[row.name] = { column: row.column };
    return vars;
  }, {});

export const getTakenVarNames = (rows: VarRow[], currentId: string): Set<string> =>
  new Set(rows.filter((row) => row.id !== currentId && row.name).map((row) => row.name));
