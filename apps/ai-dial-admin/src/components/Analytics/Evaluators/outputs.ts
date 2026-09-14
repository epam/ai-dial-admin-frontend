import { EvaluatorOutput, EvaluatorType } from '@/src/models/analytics/evaluator';
import { OutputRefinementKind, OutputRow } from '@/src/models/analytics/evaluator-ui';
import { getOutputText } from '@/src/utils/analytics/evaluator-dto';

let counter = 0;
const nextRowId = (): string => `output-${++counter}`;

// A stored version carries at most one of the two, so which one it carries is the selection. A version
// carrying neither selects the transform and shows it empty, which sends nothing.
const toRefinement = (output: EvaluatorOutput): OutputRefinementKind =>
  output.values?.length ? OutputRefinementKind.Values : OutputRefinementKind.Jsonata;

export const createOutputRow = (): OutputRow => ({
  id: nextRowId(),
  name: '',
  text: '',
  refinement: OutputRefinementKind.Jsonata,
  values: [],
  jsonata: '',
});

export const toOutputRows = (outputs: EvaluatorOutput[] | undefined, type: EvaluatorType): OutputRow[] =>
  (outputs ?? []).map((output) => ({
    id: nextRowId(),
    name: output.name ?? '',
    text: getOutputText(output, type),
    refinement: toRefinement(output),
    values: output.values ?? [],
    jsonata: output.jsonata ?? '',
  }));

// The row keeps one `text` whichever type is selected, so flipping the type moves the expression into
// the member that type uses rather than losing it. The unselected refinement is kept the same way: it
// stays on the row and is left out of the declaration.
export const toOutputs = (rows: OutputRow[], type: EvaluatorType): EvaluatorOutput[] =>
  rows.map((row) => {
    if (type === EvaluatorType.Sql) {
      return { name: row.name, sql: row.text };
    }

    return {
      name: row.name,
      prose: row.text,
      ...(row.refinement === OutputRefinementKind.Values && row.values.length ? { values: row.values } : {}),
      ...(row.refinement === OutputRefinementKind.Jsonata && row.jsonata ? { jsonata: row.jsonata } : {}),
    };
  });
