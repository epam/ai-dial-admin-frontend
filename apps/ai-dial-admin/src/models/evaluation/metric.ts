import { JSONSchema7 } from 'json-schema';
import { MetricBindingType } from '@/src/types/evaluation';

export interface Metric {
  id?: string;
  name?: string;
  displayName?: string;
  description?: string;
  createdAt?: string;
  providerId?: string;
  configSchema?: JSONSchema7;
  inputSchema?: JSONSchema7;
  outputSchema?: JSONSchema7;

  configBindings?: MetricBinding[];
  inputBindings?: MetricBinding[];

  // declaration
  metricDeclarationId?: string;
  metricDeclarationVersionId?: string;

  // aggregated
  metricDeclaration?: Metric;
  metricDeclarationVersion?: Metric;
}

export interface MetricResponse {
  content: Metric[];
  totalElements?: number;
  totalPages?: number;
  page: number;
  size: number;
}

export interface MetricBinding {
  property: string;
  source: BindingSource;
}

export interface BindingSource {
  $type: MetricBindingType;
  value?: BindingSourceValue;
  columnName?: string;
  // Response bindings only: JSONata selector applied to the resolved column value.
  // For multi-step suites the column value is a per-turn array (e.g. "$[-1]" picks the last turn).
  jsonataExpression?: string;
}

export type BindingSourceValue =
  | string
  | string[]
  | Record<string, unknown>[]
  | Record<string, unknown>
  | number
  | boolean;

export interface MetricSnapshot {
  id?: string;
  computationId?: string;
  testSuiteRunId?: string;
  tsmdId?: string;
  tsmdName?: string;
  metricDeclarationId?: string;
  metricDeclarationVersionId?: string;
  configBindings?: MetricBinding[];
  inputBindings?: MetricBinding[];
  outputSchema?: JSONSchema7;
  computedAtMs?: number;
}

export type MetricBindings = { configBindings: MetricBinding[]; inputBindings: MetricBinding[] };
