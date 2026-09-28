import { DialRoute } from '@/src/models/dial/route';
import { TestSuiteEndpointRef, TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import { CHAT_COMPLETION_METHOD } from '@/src/components/TestSuites/constants/chat-completion-method';
import { CHAT_COMPLETION_SUITE, DEFAULT_SUITE } from '@/src/components/TestSuites/constants/methods';

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

    paths.forEach((path) => {
      methods.forEach((method) => {
        result.push({
          method,
          relativeUrlPattern: path,
        });
      });
    });
  }
  return result;
};

/**
 * The request template a method starts with, as applied by `Methods.onMethodClick` when the method is
 * first selected — chat completion gets its fixed default body, any other route gets an empty body.
 * Used to power "Reset to default" on an already-configured request without changing its method.
 */
export const getDefaultRequestTemplateFor = (
  endpointRef?: TestSuiteEndpointRef,
): TestSuiteRequestTemplate | undefined => {
  if (!endpointRef?.method || !endpointRef?.relativeUrlPattern) {
    return undefined;
  }

  if (
    endpointRef.method === CHAT_COMPLETION_METHOD.method &&
    endpointRef.relativeUrlPattern === CHAT_COMPLETION_METHOD.relativeUrlPattern
  ) {
    return CHAT_COMPLETION_SUITE.requestTemplate;
  }

  return DEFAULT_SUITE(endpointRef).requestTemplate;
};
