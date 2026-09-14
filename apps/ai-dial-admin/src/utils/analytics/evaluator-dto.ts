import { trimmedString } from '@/src/utils/formatting/trimmed-string';
import {
  CreateEvaluatorDto,
  Evaluator,
  EvaluatorOutput,
  EvaluatorOutputSpec,
  EvaluatorParamRow,
  EvaluatorRequest,
  EvaluatorType,
  EvaluatorVar,
} from '@/src/models/analytics/evaluator';

const READ_ONLY_MEMBERS = ['version', 'created_at', 'output_vars', 'input_vars', 'response_schema'] as const;

const asVars = (value: unknown): EvaluatorVar[] =>
  (Array.isArray(value) ? value : []).filter((item): item is EvaluatorVar => Boolean(item) && typeof item === 'object');

const asOutputs = (value: unknown): EvaluatorOutput[] =>
  (Array.isArray(value) ? value : []).filter(
    (item): item is EvaluatorOutput => Boolean(item) && typeof item === 'object',
  );

const schemaProperty = (schema: unknown, name: string): Record<string, unknown> => {
  const properties = (schema as Record<string, unknown> | undefined)?.properties;
  const property = (properties as Record<string, unknown> | undefined)?.[name];
  return (property as Record<string, unknown>) ?? {};
};

const asStringList = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.length ? value.map(String) : undefined;

/**
 * A version stored before `outputs` is served as written, so the entries are rebuilt from the members it
 * does carry. The order comes from `output_vars` and never from `response_schema`: the schema is stored
 * as a JSON object, whose key order the store assigns rather than the author.
 */
const fromLegacyVars = (evaluator: Evaluator): EvaluatorOutput[] =>
  asVars(evaluator.output_vars).map((item) => {
    if (evaluator.type === EvaluatorType.Sql) {
      return { name: item.name, sql: item.sql };
    }

    const property = schemaProperty(evaluator.response_schema, item.name);

    return {
      name: item.name,
      prose: property.description as string | undefined,
      values: asStringList(property.enum),
      jsonata: item.jsonata,
    };
  });

/** One model whichever shape the version is stored in: the current member first, the superseded one after. */
export const toEvaluatorOutputs = (evaluator: Evaluator): EvaluatorOutput[] => {
  const outputs = asOutputs(evaluator.outputs);
  return outputs.length ? outputs : fromLegacyVars(evaluator);
};

/**
 * A type change is not a relabelling. An llm output carries prose — what the model is told — and a sql one
 * carries the expression that produces the value; neither reads as the other, and the service refuses each
 * on the other's type. The declaration is therefore dropped rather than carried into a shape where every
 * entry would have to be rewritten anyway — unless the same patch states one, which is a caller replacing
 * both at once rather than an operator flipping the control.
 */
export const applyTypeChange = (
  previous: CreateEvaluatorDto,
  patch: Partial<CreateEvaluatorDto>,
): Partial<CreateEvaluatorDto> =>
  patch.type && patch.type !== previous.type && patch.outputs === undefined ? { ...patch, outputs: [] } : patch;

export const toEvaluatorDraft = (evaluator: Evaluator): CreateEvaluatorDto => {
  const draft = { ...evaluator } as CreateEvaluatorDto & Record<string, unknown>;
  READ_ONLY_MEMBERS.forEach((key) => delete draft[key]);
  draft.outputs = toEvaluatorOutputs(evaluator);
  return draft;
};

const isEmpty = (value: unknown): boolean =>
  value == null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);

// Rebuilt from the selected type on every save rather than carried over: the service answers 422 for an
// llm-only member on a sql evaluator rather than ignoring it.
const LLM_ONLY_MEMBERS = ['preset', 'model', 'params', 'request_template'] as const;

const toOutputSpec = (output: EvaluatorOutput, type: EvaluatorType): EvaluatorOutputSpec => {
  if (type === EvaluatorType.Sql) {
    return trimmedString(output.sql ?? output.prose) ?? '';
  }

  const prose = trimmedString(output.prose ?? output.sql) ?? '';
  const values = output.values?.filter((value) => trimmedString(value));
  const jsonata = trimmedString(output.jsonata);

  if (values?.length) return { prose, values };
  if (jsonata) return { prose, jsonata };
  return { prose };
};

/**
 * Everything on the draft is carried through, including members no control presents: an allow-list would
 * silently drop what the JSON editor introduced. The superseded members are the exception — a draft is
 * normalized on read, so a save always writes the current shape.
 */
export const buildEvaluatorDto = (draft: CreateEvaluatorDto): EvaluatorRequest => {
  const dto = { ...draft } as unknown as EvaluatorRequest & Record<string, unknown>;

  READ_ONLY_MEMBERS.forEach((key) => delete dto[key]);

  dto.outputs = asOutputs(draft.outputs)
    .filter((output) => trimmedString(output.name))
    .reduce<Record<string, EvaluatorOutputSpec>>((outputs, output) => {
      // The name is the target column, so a stray space would bind to a column that does not exist.
      outputs[trimmedString(output.name)] = toOutputSpec(output, draft.type);
      return outputs;
    }, {});

  if (draft.type === EvaluatorType.Sql) {
    LLM_ONLY_MEMBERS.forEach((key) => delete dto[key]);
  }

  Object.keys(dto).forEach((key) => {
    if (key !== 'outputs' && isEmpty(dto[key])) delete dto[key];
  });

  return dto;
};

// Falls back to the other member so flipping the evaluator's type moves what was typed rather than
// losing it — the same carry the request builder performs.
export const getOutputText = (output: EvaluatorOutput, type: EvaluatorType): string =>
  (type === EvaluatorType.Sql ? (output.sql ?? output.prose) : (output.prose ?? output.sql)) ?? '';

const hasDuplicateName = (outputs: EvaluatorOutput[]): boolean =>
  new Set(outputs.map((output) => trimmedString(output.name))).size !== outputs.length;

export const isEvaluatorShapeValid = (draft: CreateEvaluatorDto): boolean => {
  if (!trimmedString(draft.name) || !draft.type) return false;

  const outputs = asOutputs(draft.outputs);
  if (!outputs.length || hasDuplicateName(outputs)) return false;
  if (outputs.some((output) => !trimmedString(output.name) || !trimmedString(getOutputText(output, draft.type))))
    return false;

  return draft.type === EvaluatorType.Sql || Boolean(trimmedString(draft.model));
};

export const toParamRows = (params: Record<string, unknown> = {}): EvaluatorParamRow[] =>
  Object.entries(params).map(([key, value], index) => ({
    id: `param-${index}-${key}`,
    key,
    value: String(value ?? ''),
  }));

/**
 * A number that round-trips stays a number: the service types these knobs, so posting `max_tokens` as a
 * string changes what it receives. A blank key is dropped — it would otherwise register `{"": ""}` into a
 * version that can never be corrected.
 */
export const toParams = (rows: EvaluatorParamRow[]): Record<string, unknown> =>
  rows.reduce<Record<string, unknown>>((params, row) => {
    const key = row.key.trim();
    if (!key) return params;
    const asNumber = Number(row.value);
    params[key] = row.value.trim() !== '' && Number.isFinite(asNumber) ? asNumber : row.value;
    return params;
  }, {});
