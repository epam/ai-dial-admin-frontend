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

const toTypedVar = (item: EvaluatorVar, type: EvaluatorType): EvaluatorVar => {
  const expression = getVarExpression(item);
  const base = { name: item.name, type: item.type };
  if (!expression) return base;
  return type === EvaluatorType.Sql ? { ...base, sql: expression } : { ...base, jsonata: expression };
};

const isEmpty = (value: unknown): boolean =>
  value == null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);

const namedVars = (vars: EvaluatorVar[] | undefined, type: EvaluatorType): EvaluatorVar[] =>
  (vars ?? []).filter((item) => item.name?.trim()).map((item) => toTypedVar(item, type));

export const buildEvaluatorDto = (draft: CreateEvaluatorDto): CreateEvaluatorDto => {
  const dto: CreateEvaluatorDto = {
    name: draft.name,
    type: draft.type,
    output_vars: namedVars(draft.output_vars, draft.type),
  };

  // The service answers 422 for an llm-only member on a sql evaluator rather than ignoring it, so
  // switching type must drop them rather than carry them over.
  if (draft.type !== EvaluatorType.Sql) {
    Object.assign(dto, {
      preset: draft.preset,
      model: draft.model,
      params: draft.params,
      request_template: draft.request_template,
      input_vars: namedVars(draft.input_vars, draft.type),
      response_schema: draft.response_schema,
    });
  }

  const pruned = dto as CreateEvaluatorDto & Record<string, unknown>;
  Object.keys(pruned).forEach((key) => {
    if (isEmpty(pruned[key])) delete pruned[key];
  });

  return dto;
};

export const isEvaluatorShapeValid = (draft: CreateEvaluatorDto): boolean => {
  if (!draft.name?.trim() || !draft.type) return false;

  const outputVars = draft.output_vars ?? [];
  if (!outputVars.length || outputVars.some((item) => !item.name?.trim() || !item.type)) return false;

  if (draft.type === EvaluatorType.Sql) {
    return outputVars.every((item) => Boolean(getVarExpression(item)));
  }

  return Boolean(draft.preset) && Boolean(draft.model?.trim());
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
