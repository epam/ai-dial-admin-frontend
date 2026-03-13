import { JSONSchema7 } from 'json-schema';

export interface Metric {
  id?: string;
  name?: string;
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
  $type: string;
  value?: string;
  columnName?: string;
}
