import { SuiteType, TestSuite, TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';

export const normalizeRequestTemplate = (
  template: TestSuiteRequestTemplate | undefined,
): TestSuiteRequestTemplate | undefined => {
  const body = template?.body;

  if (!template || !body || body.jsonataContent !== '') {
    return template;
  }

  const { jsonataContent: __jsonataContent, ...restBody } = body;

  return { ...template, body: restBody };
};

export const normalizeTestSuitePayload = (suite: TestSuite): TestSuite => {
  const normalized: TestSuite = {
    ...suite,
    requestTemplate: normalizeRequestTemplate(suite.requestTemplate),
    additionalRequests: suite.additionalRequests?.map((request) => ({
      ...request,
      requestTemplate: normalizeRequestTemplate(request.requestTemplate),
    })),
  };

  if (suite.suiteType !== SuiteType.McpTool) {
    return normalized;
  }

  const { requestName: __requestName, additionalRequests: __additionalRequests, ...rest } = normalized;

  return rest;
};
