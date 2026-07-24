export interface MetricOutputOption {
  value: string;
  metricName: string;
  outputField: string;
  label: string;
}

export enum OverallScoreFunctionName {
  RocAuc = 'roc_auc',
}

export enum FunctionParameterSourceType {
  TestCase = 'TestCase',
  Response = 'Response',
  Metric = 'Metric',
}

export interface FunctionParameterSource {
  $type: FunctionParameterSourceType;
  columnName?: string;
  metricName?: string;
  outputField?: string;
}
