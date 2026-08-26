export enum EvaluatorType {
  Llm = 'llm',
  Sql = 'sql',
}

export enum EvaluatorPreset {
  ChatCompletion = 'chat_completion',
}

/**
 * The codes an evaluator variable's `type` resolves against (the service's `QueryFieldType`). Deliberately
 * separate from `AnalyticsFieldType`: that one is the table catalog's column type — it drives the
 * column-type select and an exhaustive sample map — and it does not admit `map`.
 */
export enum EvaluatorVarType {
  Uuid = 'uuid',
  String = 'string',
  Integer = 'integer',
  Long = 'long',
  Decimal = 'decimal',
  Boolean = 'boolean',
  Date = 'date',
  Timestamp = 'timestamp',
  Object = 'object',
  Array = 'array',
  Map = 'map',
}

export interface EvaluatorVar {
  name: string;
  type: string;
  sql?: string;
  jsonata?: string;
}

export interface EvaluatorSummary {
  name: string;
  latest_version: number;
  /** Dates the name's first registration, not the running version — `Evaluator.created_at` dates that. */
  created_at?: string;
}

// A Map, not a Record: an evaluator name is only `@NotBlank` on the service, so `constructor`, `toString`,
// and `__proto__` are all registerable and a plain object mishandles every one of them.
export type EvaluatorUsage = Map<string, number>;

export interface EvaluatorListRow {
  name: string;
  latest_version: number;
  created_at?: string;
  usedBy: number | null;
}

/**
 * Carries no version by design: POST creates version 1 for an unknown `name` and appends
 * `latest_version + 1` for a known one, so posting against an existing name is how a version is made.
 */
/** A params entry while it is being edited: two rows may share a key, or be blank, which an object cannot hold. */
export interface EvaluatorParamRow {
  id: string;
  key: string;
  value: string;
}

export interface CreateEvaluatorDto {
  name: string;
  type: EvaluatorType;
  preset?: EvaluatorPreset;
  model?: string;
  params?: Record<string, unknown>;
  request_template?: string;
  input_vars?: EvaluatorVar[];
  response_schema?: Record<string, unknown>;
  output_vars?: EvaluatorVar[];
}

export interface Evaluator {
  name: string;
  version: number;
  type: EvaluatorType;
  preset?: EvaluatorPreset;
  model?: string;
  params?: Record<string, unknown>;
  request_template?: string;
  response_schema?: Record<string, unknown>;
  input_vars?: EvaluatorVar[];
  output_vars?: EvaluatorVar[];
  created_at?: string;
}
