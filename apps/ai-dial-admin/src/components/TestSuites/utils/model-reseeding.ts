import {
  TestSuite,
  TestSuiteAdditionalRequest,
  TestSuiteEndpointRef,
  TestSuiteRequestTemplate,
} from '@/src/models/evaluation/test-suite';

const matchesEndpoint = (
  endpointRef: TestSuiteEndpointRef | undefined,
  targetEndpoints: readonly TestSuiteEndpointRef[],
): boolean =>
  targetEndpoints.some(
    (target) => endpointRef?.method === target.method && endpointRef?.relativeUrlPattern === target.relativeUrlPattern,
  );

const withModel = (
  template: TestSuiteRequestTemplate | undefined,
  deploymentId: string,
): TestSuiteRequestTemplate | undefined => {
  const content = template?.body?.content;

  if (!content || Array.isArray(content)) {
    return template;
  }

  return {
    ...template,
    body: {
      ...template.body,
      content: { ...content, model: deploymentId },
    },
  };
};

const reseedRequest = <T extends { endpointRef?: TestSuiteEndpointRef; requestTemplate?: TestSuiteRequestTemplate }>(
  request: T,
  deploymentId: string,
  targetEndpoints: readonly TestSuiteEndpointRef[],
): T =>
  matchesEndpoint(request.endpointRef, targetEndpoints)
    ? { ...request, requestTemplate: withModel(request.requestTemplate, deploymentId) }
    : request;

/** Rewrites `model` for matching top-level and chained requests without mutating the suite. */
export const reseedRequestModels = (
  suite: TestSuite,
  deploymentId: string,
  targetEndpoints: readonly TestSuiteEndpointRef[],
): TestSuite => {
  if (!deploymentId) {
    return suite;
  }

  const reseeded = reseedRequest(suite, deploymentId, targetEndpoints);
  const additionalRequests = suite.additionalRequests?.map((request: TestSuiteAdditionalRequest) =>
    reseedRequest(request, deploymentId, targetEndpoints),
  );

  if (
    reseeded === suite &&
    !additionalRequests?.some((request, index) => request !== suite.additionalRequests?.[index])
  ) {
    return suite;
  }

  return additionalRequests ? { ...reseeded, additionalRequests } : reseeded;
};
