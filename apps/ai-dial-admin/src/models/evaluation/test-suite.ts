import { DialScheme } from '@/src/models/dial/scheme';

export interface TestSuite {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;

  deploymentRef?: TestSuiteDeploymentRef;
  endpointRef?: TestSuiteEndpointRef;
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

export interface TestCase {
  testCaseName?: string;
  updatedAt?: number;
  valid?: boolean;
  id: string;
  enabled: boolean;
  createdAt: number;
  data?: Record<string, unknown>;
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
