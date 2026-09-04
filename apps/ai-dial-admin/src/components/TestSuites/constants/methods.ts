import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { CHAT_COMPLETION_BODY } from './chat-completion-body';
import { TestSuiteEndpointRef } from '@/src/models/evaluation/test-suite';
import { CHAT_COMPLETION_METHOD } from './chat-completion-method';
import { RESPONSES_ANSWER_EXPRESSION, RESPONSES_BODY } from './responses-body';
import { CREATE_RESPONSE_METHOD, RESPONSES_RELATIVE_URL } from './responses-method';
import { TestCaseItemType } from '@/src/types/evaluation';

export const CHAT_COMPLETION_RELATIVE_URL = '/chat/completions';
export const CHAT_COMPLETION_SUITE = {
  endpointRef: CHAT_COMPLETION_METHOD,
  requestTemplate: {
    urlTemplate: CHAT_COMPLETION_RELATIVE_URL,
    body: {
      contentType: APPLICATION_JSON_TYPE,
      content: CHAT_COMPLETION_BODY,
    },
  },
  responseColumns: [
    {
      name: 'answer',
      displayName: 'answer',
      expression: 'choices[0].message.content',
      type: TestCaseItemType.STRING,
    },
  ],
};

export const RESPONSES_SUITE = (deploymentId: string) => ({
  endpointRef: CREATE_RESPONSE_METHOD,
  requestTemplate: {
    urlTemplate: RESPONSES_RELATIVE_URL,
    body: {
      contentType: APPLICATION_JSON_TYPE,
      content: RESPONSES_BODY(deploymentId),
    },
  },
  responseColumns: [
    {
      name: 'answer',
      displayName: 'answer',
      expression: RESPONSES_ANSWER_EXPRESSION,
      type: TestCaseItemType.STRING,
    },
  ],
});

export const RESPONSE_ITEM_SUITE = (route: TestSuiteEndpointRef, urlTemplate: string) => ({
  endpointRef: route,
  requestTemplate: {
    urlTemplate,
    body: {
      contentType: APPLICATION_JSON_TYPE,
      content: {},
    },
  },
  // Explicitly empty rather than omitted: a seed is merged over the previous configuration, so
  // leaving the key out would keep the previous method's extraction expressions.
  responseColumns: [],
});

export const DEFAULT_SUITE = (route: TestSuiteEndpointRef) => ({
  endpointRef: {
    method: route.method,
    relativeUrlPattern: route.relativeUrlPattern,
  },
  requestTemplate: {
    urlTemplate: route.relativeUrlPattern,
    body: {
      contentType: APPLICATION_JSON_TYPE,
      content: {},
    },
  },
});
