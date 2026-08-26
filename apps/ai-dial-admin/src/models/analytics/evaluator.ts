export enum EvaluatorType {
  Llm = 'llm',
  Sql = 'sql',
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
  /**
   * Dates the name's first registration, not the version now running — `Evaluator.created_at` dates that,
   * and the two routinely differ.
   */
  created_at?: string;
}

// A Map, not a Record: an evaluator name is only `@NotBlank` on the service, so `constructor`,
// `toString`, and `__proto__` are all registerable and a plain object mishandles every one of them.
// It stays server-side; the view is handed rows.
export type EvaluatorUsage = Map<string, number>;

export interface EvaluatorListRow {
  name: string;
  latest_version: number;
  created_at?: string;
  // Null means the rules listing failed, which is not the same as no rule using this evaluator.
  usedBy: number | null;
}

export interface EvaluatorReferencingRule {
  id: string;
  name: string;
  version: number;
  isTrackingLatest: boolean;
}

export interface Evaluator {
  name: string;
  version: number;
  type: EvaluatorType;
  preset?: string;
  model?: string;
  params?: Record<string, unknown>;
  request_template?: string;
  response_schema?: Record<string, unknown>;
  input_vars?: EvaluatorVar[];
  output_vars?: EvaluatorVar[];
  created_at?: string;
}
