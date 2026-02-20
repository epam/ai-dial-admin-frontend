import { DialScheme } from '@/src/models/dial/scheme';
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
  requestBodySchema?: DialScheme;
  responseBodySchema?: DialScheme;
}

export interface TestSuiteRequestTemplate {
  urlTemplate?: string;
  body?: Record<string, unknown>;
  headers?: TestSuiteRequestTemplateParam[];
  queryParams?: TestSuiteRequestTemplateParam[];
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

export interface TestSuiteRun {
  id: string;
  testSuiteId: string;
  testRunName: string;
  status: string;
  runConfig: {
    numberOfRuns: number;
    testRunName: string;
  };
  numberOfTestCases: number;
  startedAt: number;
  completedAt: number;
  errorMessage: string;
  errorDetails: {
    code: string;
    category: string;
    message: string;
    details: Record<string, unknown>;
  };
  createdAt: number;
  updatedAt: number;
}

export interface TemplateVariable {
  defaultValue: unknown;
  hasDefault: boolean;
  inferredType: TestCaseItemType;
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
  inferredType?: TestCaseItemType;
  type?: InputBindingType;
  value?: unknown;
  defaultValue?: unknown;
}
