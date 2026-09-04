import { CREATE_RESPONSE_METHOD } from '@/src/components/TestSuites/constants/responses-method';
import {
  TestSuite,
  TestSuiteAdditionalRequest,
  TestSuiteEndpointRef,
  TestSuiteRequestTemplate,
} from '@/src/models/evaluation/test-suite';

const isCreateResponseRequest = (endpointRef?: TestSuiteEndpointRef): boolean =>
  endpointRef?.method === CREATE_RESPONSE_METHOD.method &&
  endpointRef?.relativeUrlPattern === CREATE_RESPONSE_METHOD.relativeUrlPattern;

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
      ...template?.body,
      content: { ...content, model: deploymentId },
    },
  };
};

const reseedRequest = <T extends { endpointRef?: TestSuiteEndpointRef; requestTemplate?: TestSuiteRequestTemplate }>(
  request: T,
  deploymentId: string,
): T =>
  isCreateResponseRequest(request.endpointRef)
    ? { ...request, requestTemplate: withModel(request.requestTemplate, deploymentId) }
    : request;

/**
 * Rewrites `model` in every create-response request body so it names the suite's current target.
 *
 * DIAL's Responses API endpoint carries no deployment segment, so `model` is what selects the
 * deployment. Changing a suite's target otherwise leaves the old id in place and the suite keeps
 * invoking the previous deployment — silently, because that id still names a real one.
 *
 * Requests on any other method, and bodies that are form-data parts, are returned untouched.
 */
export const reseedResponsesModel = (suite: TestSuite, deploymentId: string): TestSuite => {
  if (!deploymentId) {
    return suite;
  }

  const reseeded = reseedRequest(suite, deploymentId);
  const additionalRequests = suite.additionalRequests?.map((request: TestSuiteAdditionalRequest) =>
    reseedRequest(request, deploymentId),
  );

  if (
    reseeded === suite &&
    !additionalRequests?.some((request, index) => request !== suite.additionalRequests?.[index])
  ) {
    return suite;
  }

  return additionalRequests ? { ...reseeded, additionalRequests } : reseeded;
};
