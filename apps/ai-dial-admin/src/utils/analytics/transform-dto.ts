import {
  PipelineTransform,
  TransformOutput,
  TransformOutputSpec,
  TransformType,
  TransformVar,
} from '@/src/models/analytics/pipeline';
import { TransformDraft, TransformParamRow } from '@/src/models/analytics/pipeline-ui';
import { trimmedString } from '@/src/utils/formatting/trimmed-string';

// Rebuilt from the selected type on every save rather than carried over: the service answers 422 for an
// llm-only member on a sql transform rather than ignoring it.
const LLM_ONLY_MEMBERS = ['preset', 'model', 'params', 'request_template', 'inputs', 'response_schema'] as const;

const LEGACY_OUTPUT_MEMBERS = ['output_vars', 'response_schema'] as const;

const asVars = (value: unknown): TransformVar[] =>
  (Array.isArray(value) ? value : []).filter((item): item is TransformVar => Boolean(item) && typeof item === 'object');

const schemaProperty = (schema: unknown, name: string): Record<string, unknown> => {
  const properties = (schema as Record<string, unknown> | undefined)?.properties;
  const property = (properties as Record<string, unknown> | undefined)?.[name];
  return (property as Record<string, unknown>) ?? {};
};

const asStringList = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.length ? value.map(String) : undefined;

const fromOutputSpec = (name: string, spec: TransformOutputSpec, type: TransformType): TransformOutput => {
  if (typeof spec === 'string') {
    return type === TransformType.Sql ? { name, sql: spec } : { name, prose: spec };
  }

  return { name, prose: spec.prose, values: spec.values, jsonata: spec.jsonata };
};

/**
 * The order comes from `output_vars` and never from `response_schema`: the schema is stored as a JSON
 * object, whose key order the store assigns rather than the author.
 */
const fromLegacyVars = (transform: PipelineTransform): TransformOutput[] =>
  asVars(transform.output_vars).map((item) => {
    if (transform.type === TransformType.Sql) {
      return { name: item.name, sql: item.sql };
    }

    const property = schemaProperty(transform.response_schema, item.name);

    return {
      name: item.name,
      prose: property.description as string | undefined,
      values: asStringList(property.enum),
      jsonata: item.jsonata,
    };
  });

export const toTransformOutputs = (transform: PipelineTransform): TransformOutput[] => {
  const outputs = transform.outputs;
  if (!outputs) return fromLegacyVars(transform);

  return Object.entries(outputs).map(([name, spec]) => fromOutputSpec(name, spec, transform.type));
};

/**
 * The JSON editor hands back whatever was typed, so a save reads either shape rather than assuming the
 * rows it published. A document edited to neither is read as no outputs, which the form reports as invalid.
 */
export const asOutputList = (value: unknown, type: TransformType): TransformOutput[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is TransformOutput => Boolean(item) && typeof item === 'object');
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, TransformOutputSpec>).map(([name, spec]) =>
      fromOutputSpec(name, spec, type),
    );
  }

  return [];
};

export const hasLegacyOutputs = (transform?: PipelineTransform): boolean =>
  Boolean(transform && !transform.outputs && asVars(transform.output_vars).length);

export const toTransformDraft = (transform: PipelineTransform): TransformDraft => ({
  ...transform,
  outputs: toTransformOutputs(transform),
});

// Falls back to the other member so flipping the transform's type moves what was typed rather than
// losing it.
export const getOutputText = (output: TransformOutput, type: TransformType): string =>
  (type === TransformType.Sql ? (output.sql ?? output.prose) : (output.prose ?? output.sql)) ?? '';

const toOutputSpec = (output: TransformOutput, type: TransformType): TransformOutputSpec => {
  if (type === TransformType.Sql) {
    return trimmedString(output.sql ?? output.prose) ?? '';
  }

  // Absent prose is what the service defaults from the target column's description, so an untouched one
  // is left out rather than sent blank — sending it would store a copy that a later column edit cannot
  // reach.
  const prose = trimmedString(output.prose ?? output.sql);
  const values = output.values?.filter((value) => trimmedString(value));
  const jsonata = trimmedString(output.jsonata);
  const body = { ...(prose ? { prose } : {}) };

  // The form offers one refinement at a time, so both can only arrive from the JSON editor — where
  // picking one for the author would save something other than what they typed. Sent as written, the
  // service names the conflict.
  if (values?.length && jsonata) return { ...body, values, jsonata };
  if (values?.length) return { ...body, values };
  if (jsonata) return { ...body, jsonata };
  return prose ? prose : {};
};

const isSameOutputs = (a: TransformOutput[] = [], b: TransformOutput[] = []): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

const isEmpty = (value: unknown): boolean =>
  value == null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);

/**
 * Everything on the draft is carried through, including members no control presents: an allow-list would
 * silently drop what the JSON editor introduced.
 *
 * A declaration still stored in the superseded shape keeps it, unedited. Rewriting it into `outputs`
 * would discard the stored `response_schema` the service keeps serving verbatim — which is what the model
 * is held to — so the two legacy members are sent back untouched until the outputs are actually changed.
 * Once they are, both go: the service refuses a declaration carrying the two shapes together.
 */
export const buildTransformDto = (draft: TransformDraft, stored?: PipelineTransform): PipelineTransform => {
  const dto = { ...draft } as PipelineTransform & Record<string, unknown>;
  const declared = asOutputList(draft.outputs, draft.type);
  const outputs = declared.filter((output) => trimmedString(output.name));

  // A type change rewrites the shape whatever the outputs say: both superseded members are llm-only, and
  // a sql declaration carrying either is refused.
  const isLegacyUntouched =
    hasLegacyOutputs(stored) &&
    draft.type === stored?.type &&
    isSameOutputs(declared, stored && toTransformOutputs(stored));

  if (isLegacyUntouched) {
    delete dto.outputs;
  } else {
    LEGACY_OUTPUT_MEMBERS.forEach((key) => delete dto[key]);

    dto.outputs = outputs.reduce<Record<string, TransformOutputSpec>>((map, output) => {
      // The name is the target column, so a stray space would bind to a column that does not exist.
      map[trimmedString(output.name)] = toOutputSpec(output, draft.type);
      return map;
    }, {});
  }

  if (draft.type === TransformType.Sql) {
    LLM_ONLY_MEMBERS.forEach((key) => delete dto[key]);
  }

  Object.keys(dto).forEach((key) => {
    if (key !== 'outputs' && isEmpty(dto[key])) delete dto[key];
  });

  return dto;
};

const hasDuplicateName = (outputs: TransformOutput[]): boolean =>
  new Set(outputs.map((output) => trimmedString(output.name))).size !== outputs.length;

/** What the console can tell before the service does: a shape that could not be stored at all. */
export const isTransformValid = (draft?: TransformDraft): boolean => {
  if (!draft?.type) return false;

  const outputs = asOutputList(draft.outputs, draft.type);
  if (!outputs.length || hasDuplicateName(outputs)) return false;

  // Only a sql output's text is required — an llm output's prose defaults to the column's description.
  if (outputs.some((output) => !trimmedString(output.name))) return false;
  if (draft.type === TransformType.Sql) {
    return outputs.every((output) => trimmedString(getOutputText(output, draft.type)));
  }

  // The template is a shape check the service runs on every write, unlike the placeholder
  // correspondence it defers to enable: a blank prompt is refused, not stored as a draft.
  return Boolean(trimmedString(draft.model)) && Boolean(trimmedString(draft.request_template));
};

export const toParamRows = (params: Record<string, unknown> = {}): TransformParamRow[] =>
  Object.entries(params).map(([key, value], index) => ({
    id: `param-${index}-${key}`,
    key,
    value: String(value ?? ''),
  }));

/**
 * A number that round-trips stays a number: the service types these knobs, so posting `max_tokens` as a
 * string changes what it receives. A blank key is dropped — it would otherwise register `{"": ""}`.
 */
export const toParams = (rows: TransformParamRow[]): Record<string, unknown> =>
  rows.reduce<Record<string, unknown>>((params, row) => {
    const key = row.key.trim();
    if (!key) return params;
    const asNumber = Number(row.value);
    params[key] = row.value.trim() !== '' && Number.isFinite(asNumber) ? asNumber : row.value;
    return params;
  }, {});
