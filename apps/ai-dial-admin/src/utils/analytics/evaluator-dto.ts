import { trimmedString } from '@/src/utils/formatting/trimmed-string';
import {
  CreateEvaluatorDto,
  Evaluator,
  EvaluatorParamRow,
  EvaluatorType,
  EvaluatorVar,
} from '@/src/models/analytics/evaluator';

const READ_ONLY_MEMBERS: (keyof Evaluator)[] = ['version', 'created_at'];

export const toEvaluatorDraft = (evaluator: Evaluator): CreateEvaluatorDto => {
  const draft = { ...evaluator } as CreateEvaluatorDto & Record<string, unknown>;
  READ_ONLY_MEMBERS.forEach((key) => delete draft[key]);
  return draft;
};

export const getVarExpression = (item: EvaluatorVar): string => item.sql ?? item.jsonata ?? '';

const asVars = (value: unknown): EvaluatorVar[] =>
  (Array.isArray(value) ? value : []).filter((item): item is EvaluatorVar => Boolean(item) && typeof item === 'object');

const toTypedVar = (item: EvaluatorVar, type: EvaluatorType): EvaluatorVar => {
  const expression = getVarExpression(item);
  const base = { ...item };
  delete base.sql;
  delete base.jsonata;

  if (!expression) return base;
  return type === EvaluatorType.Sql ? { ...base, sql: expression } : { ...base, jsonata: expression };
};

const isEmpty = (value: unknown): boolean =>
  value == null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);

const namedVars = (vars: unknown, type: EvaluatorType): EvaluatorVar[] =>
  asVars(vars)
    .filter((item) => trimmedString(item.name))
    .map((item) => toTypedVar(item, type));

// Rebuilt from the selected type on every save rather than carried over: the service answers 422 for an
// llm-only member on a sql evaluator rather than ignoring it.
const LLM_ONLY_MEMBERS: (keyof CreateEvaluatorDto)[] = [
  'preset',
  'model',
  'params',
  'request_template',
  'input_vars',
  'response_schema',
];

// Everything on the draft is carried through, including members no control presents: an allow-list would
// silently drop what the JSON editor introduced.
export const buildEvaluatorDto = (draft: CreateEvaluatorDto): CreateEvaluatorDto => {
  const dto = { ...draft } as CreateEvaluatorDto & Record<string, unknown>;

  READ_ONLY_MEMBERS.forEach((key) => delete dto[key]);

  dto.output_vars = namedVars(draft.output_vars, draft.type);

  if (draft.type === EvaluatorType.Sql) {
    LLM_ONLY_MEMBERS.forEach((key) => delete dto[key]);
  } else {
    dto.input_vars = namedVars(draft.input_vars, draft.type);
  }

  Object.keys(dto).forEach((key) => {
    if (isEmpty(dto[key])) delete dto[key];
  });

  return dto;
};

export const isEvaluatorShapeValid = (draft: CreateEvaluatorDto): boolean => {
  if (!trimmedString(draft.name) || !draft.type) return false;

  const outputVars = asVars(draft.output_vars);
  if (!outputVars.length || outputVars.some((item) => !trimmedString(item.name) || !item.type)) return false;

  if (draft.type === EvaluatorType.Sql) {
    return outputVars.every((item) => Boolean(getVarExpression(item)));
  }

  return Boolean(draft.preset) && Boolean(trimmedString(draft.model));
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
