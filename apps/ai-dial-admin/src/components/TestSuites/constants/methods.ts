import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { CHAT_COMPLETION_BODY } from './chat-completion-body';
import { TestSuiteEndpointRef } from '@/src/models/evaluation/test-suite';
import { CHAT_COMPLETION_METHOD } from './chat-completion-method';

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
      type: 'string',
    },
  ],
};

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
