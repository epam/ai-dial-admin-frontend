import { DialRoute } from '@/src/models/dial/route';
import { TestSuiteEndpointRef } from '@/src/models/evaluation/test-suite';

export const generateMethodPathCombinations = (input?: Record<string, DialRoute>): TestSuiteEndpointRef[] => {
  const result: TestSuiteEndpointRef[] = [];
  if (!input) {
    return [];
  }
  for (const route of Object.values(input)) {
    const { methods = [], paths = [] } = route;

    if (!methods.length || !paths.length) {
      continue;
    }

    methods.forEach((method) => {
      paths.forEach((path) => {
        result.push({
          method,
          relativeUrl: path,
        });
      });
    });
  }
  return result;
};
