import { describe, expect, test } from 'vitest';

import { CREATE_MESSAGE_METHOD } from '@/src/components/TestSuites/constants/anthropic-messages-method';
import { CREATE_RESPONSE_METHOD } from '@/src/components/TestSuites/constants/responses-method';
import { reseedRequestModels } from '@/src/components/TestSuites/utils/model-reseeding';
import { TestSuite } from '@/src/models/evaluation/test-suite';

describe('reseedRequestModels', () => {
  test('rewrites each matching request using one traversal', () => {
    const suite = {
      endpointRef: CREATE_MESSAGE_METHOD,
      requestTemplate: { body: { content: { model: 'old-anthropic', messages: [] } } },
      additionalRequests: [
        {
          name: 'response',
          endpointRef: CREATE_RESPONSE_METHOD,
          requestTemplate: { body: { content: { model: 'old-response', input: 'hi' } } },
        },
      ],
    } as TestSuite;

    const result = reseedRequestModels(suite, 'new-deployment', [CREATE_MESSAGE_METHOD, CREATE_RESPONSE_METHOD]);

    expect(result.requestTemplate?.body?.content).toEqual({ model: 'new-deployment', messages: [] });
    expect(result.additionalRequests?.[0].requestTemplate?.body?.content).toEqual({
      model: 'new-deployment',
      input: 'hi',
    });
  });
});
