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

/**
 * The service refuses an identity expression — an absent transform already means a direct lookup by that
 * name — and a declaration folded from a pre-`outputs` evaluator carries one per output, so keeping them
 * would mark every row of an untouched declaration invalid and have the first save refused for a value
 * nobody authored.
 */
const withoutIdentity = (name: string, jsonata?: string): string | undefined =>
  trimmedString(jsonata) === trimmedString(name) ? undefined : jsonata;

const fromOutputSpec = (name: string, spec: TransformOutputSpec, type: TransformType): TransformOutput => {
  if (typeof spec === 'string') {
    return type === TransformType.Sql ? { name, sql: spec } : { name, prose: spec };
  }

  // An output the console sent as `{}` comes back as `null`, so reading one has to survive it.
  if (!spec) return { name };

  return { name, prose: spec.prose, values: spec.values, jsonata: withoutIdentity(name, spec.jsonata) };
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
      jsonata: withoutIdentity(item.name, item.jsonata),
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

/**
 * The one authored mistake the service never reports: `outputs` is keyed by name on the wire, so a
 * duplicate is collapsed by the parser and the second row is silently lost. Everything else an
 * unfinished transform lacks is refused when the pipeline is armed, named.
 */
export const hasDuplicateOutputName = (draft?: TransformDraft): boolean => {
  if (!draft?.type) return false;

  // Blank rows are dropped from the request, so two of them collide with nothing; counting them would
  // withhold the save for a row the author has not filled in yet.
  const names = asOutputList(draft.outputs, draft.type)
    .map((output) => trimmedString(output.name))
    .filter(Boolean);

  return new Set(names).size !== names.length;
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
