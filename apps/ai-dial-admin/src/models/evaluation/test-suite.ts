import { DialScheme } from '@/src/models/dial/scheme';
import { FormDataPart } from '@/src/models/form-data';
import { InputBindingType, TestCaseItemType } from '@/src/types/evaluation';

export interface TestSuite {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  valid?: boolean;
  validationWarnings?: ValidationWarning[];

  deploymentRef?: TestSuiteDeploymentRef;
  endpointRef?: TestSuiteEndpointRef;
  requestTemplate?: TestSuiteRequestTemplate;
  inputBindings?: InputBinding[];
  testCaseSchema?: TestCaseSchema[];
  responseColumns?: ResponseColumn[];
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  fieldName: string;
}

export interface TestSuiteDeploymentRef {
  id?: string;
  name?: string;
  version?: string;
}

export interface TestSuiteEndpointRef {
  method?: string;
  relativeUrlPattern?: string;
  parameters?: Record<string, unknown>[];
  requestBodySchema?: RequestBodySchema;
  responseBodySchema?: DialScheme;
}

export interface RequestBodySchema {
  contentType: string;
  schema: DialScheme;
}

export interface TestSuiteRequestTemplate {
  urlTemplate?: string;
  body?: TestSuiteRequestTemplateBody;
  headers?: TestSuiteRequestTemplateParam[];
  queryParams?: TestSuiteRequestTemplateParam[];
}

export interface TestSuiteRequestTemplateBody {
  contentType?: string;
  content?: Record<string, unknown> | FormDataPart[];
}

export interface TestSuiteRequestTemplateParam {
  key: string;
  value: string;
}

export interface TestCase {
  testCaseName?: string;
  updatedAt?: number;
  valid?: boolean;
  id: string;
  enabled: boolean;
  createdAt: number;
  data?: Record<string, unknown>;
  validationWarnings?: ValidationWarning[];
}

export interface TemplateVariable {
  defaultValue: unknown;
  hasDefault: boolean;
  effectiveType: TestCaseItemType;
  name: string;
  sources: string[];
}

export interface TestCaseSchema {
  name: string;
  type: TestCaseItemType;
  required: boolean;
  description: string;
}

export interface InputBinding {
  templateVariable: string;
  dataField?: string;
  constantValue?: unknown;
}

export interface InputBindingRowData extends InputBinding {
  effectiveType?: TestCaseItemType;
  type?: InputBindingType;
  value?: unknown;
  defaultValue?: unknown;
}

export interface TryOutResponse {
  resolvedRequest: Record<string, unknown>;
  response: Record<string, unknown>;
  grafanaTraceUrl?: string;
}

export interface ResponseColumn {
  name: string;
  displayName: string;
  expression: string;
  type: string;
}
