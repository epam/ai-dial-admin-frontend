export interface Run {
  id?: string;
  testSuiteId?: string;
  testRunName?: string;
  status?: string;
  runConfig?: {
    numberOfRuns?: number;
    testRunName?: string;
  };
  numberOfTestCases?: number;
  startedAt?: number;
  completedAt?: number;
  errorMessage?: string;
  errorDetails: {
    code?: string;
    category?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
  createdAt?: number;
  updatedAt?: number;
}
