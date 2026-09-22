import { TransformOutput, TransformType } from '@/src/models/analytics/pipeline';
import { OutputRefinementKind, OutputRow } from '@/src/models/analytics/pipeline-ui';
import { asOutputList, getOutputText } from '@/src/utils/analytics/transform-dto';

let counter = 0;
const nextRowId = (): string => `output-${++counter}`;

// A stored declaration carries at most one of the two, so which one it carries is the selection. One
// carrying neither lands on jsonata with an empty field, which sends nothing.
const toRefinement = (output: TransformOutput): OutputRefinementKind =>
  output.values?.length ? OutputRefinementKind.Values : OutputRefinementKind.Jsonata;

export const createOutputRow = (): OutputRow => ({
  id: nextRowId(),
  name: '',
  text: '',
  refinement: OutputRefinementKind.Jsonata,
  values: [],
  jsonata: '',
});

// Reads the wire map as readily as the rows it publishes: leaving the JSON editor hands the draft back
// in whichever shape was typed there.
export const toOutputRows = (outputs: TransformOutput[] | undefined, type: TransformType): OutputRow[] =>
  asOutputList(outputs, type).map((output) => ({
    id: nextRowId(),
    name: output.name ?? '',
    text: getOutputText(output, type),
    refinement: toRefinement(output),
    values: output.values ?? [],
    jsonata: output.jsonata ?? '',
  }));

// The unselected refinement stays on the row and is left out of the declaration, so switching back does
// not lose what was typed.
export const toOutputs = (rows: OutputRow[], type: TransformType): TransformOutput[] =>
  rows.map((row) => {
    if (type === TransformType.Sql) {
      return { name: row.name, sql: row.text };
    }

    return {
      name: row.name,
      prose: row.text,
      ...(row.refinement === OutputRefinementKind.Values && row.values.length ? { values: row.values } : {}),
      ...(row.refinement === OutputRefinementKind.Jsonata && row.jsonata ? { jsonata: row.jsonata } : {}),
    };
  });
