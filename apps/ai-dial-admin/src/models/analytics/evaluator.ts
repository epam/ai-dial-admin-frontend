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
  created_at?: string;
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
