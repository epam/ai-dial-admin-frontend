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
}

export interface TestSuiteEndpointRef {
  method?: string;
  relativeUrl?: string;
  requestBodySchema?: Record<string, unknown>;
  responseBodySchema?: Record<string, unknown>;
}

export interface TestCase {
  name?: string;
}
