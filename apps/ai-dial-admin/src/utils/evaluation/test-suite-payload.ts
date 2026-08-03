import { TestSuite } from '@/src/models/evaluation/test-suite';

export const normalizeTestSuitePayload = (suite: TestSuite): TestSuite => {
  const body = suite.requestTemplate?.body;

  if (!suite.requestTemplate || !body || body.jsonataContent !== '') {
    return suite;
  }

  const { jsonataContent: __jsonataContent, ...restBody } = body;

  return {
    ...suite,
    requestTemplate: {
      ...suite.requestTemplate,
      body: restBody,
    },
  };
};
