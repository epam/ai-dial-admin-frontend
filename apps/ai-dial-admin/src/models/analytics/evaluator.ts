export enum EvaluatorType {
  Llm = 'llm',
  Sql = 'sql',
}

export enum EvaluatorPreset {
  ChatCompletion = 'chat_completion',
}

/**
 * A version stored before the service replaced the three declaration members with `outputs`. Read-only:
 * these are normalized into `EvaluatorOutput` on read and never written back.
 */
export interface EvaluatorVar {
  name: string;
  type: string;
  sql?: string;
  jsonata?: string;
}

/**
 * What an evaluator produces for one target column. The column owns the type and the enum domain, so an
 * output carries only what the column cannot: the prose for an `llm` evaluator, the expression for a
 * `sql` one, and at most one of `values` / `jsonata` to refine an llm field.
 */
export interface EvaluatorOutput {
  name: string;
  prose?: string;
  values?: string[];
  jsonata?: string;
  sql?: string;
}

/** The object form of an llm output on the wire; a bare string is the same thing with only `prose`. */
export interface EvaluatorOutputBody {
  prose: string;
  values?: string[];
  jsonata?: string;
}

export type EvaluatorOutputSpec = string | EvaluatorOutputBody;

/**
 * What `POST /v1/evaluators` receives. Distinct from the draft because `outputs` is keyed by name on the
 * wire and ordered in the editor, and because a `sql` output is a bare expression rather than an object.
 */
export interface EvaluatorRequest {
  name: string;
  type: EvaluatorType;
  preset?: EvaluatorPreset;
  model?: string;
  params?: Record<string, unknown>;
  request_template?: string;
  outputs: Record<string, EvaluatorOutputSpec>;
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

/** A params entry while it is being edited: two rows may share a key, or be blank, which an object cannot hold. */
export interface EvaluatorParamRow {
  id: string;
  key: string;
  value: string;
}

/**
 * Carries no version by design: POST creates version 1 for an unknown `name` and appends
 * `latest_version + 1` for a known one, so posting against an existing name is how a version is made.
 *
 * `outputs` is a list here and an object keyed by name on the wire — the order is the order the model
 * fills the fields in, and a list is what carries it through an editor that can reorder rows.
 */
export interface CreateEvaluatorDto {
  name: string;
  type: EvaluatorType;
  preset?: EvaluatorPreset;
  model?: string;
  params?: Record<string, unknown>;
  request_template?: string;
  outputs?: EvaluatorOutput[];
}

export interface Evaluator {
  name: string;
  version: number;
  type: EvaluatorType;
  preset?: EvaluatorPreset;
  model?: string;
  params?: Record<string, unknown>;
  request_template?: string;
  outputs?: EvaluatorOutput[];
  // Present only on a version stored before `outputs`; the service serves such a version as written.
  response_schema?: Record<string, unknown>;
  input_vars?: EvaluatorVar[];
  output_vars?: EvaluatorVar[];
  created_at?: string;
}
