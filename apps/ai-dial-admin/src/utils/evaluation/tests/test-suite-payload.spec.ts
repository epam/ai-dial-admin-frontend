import { describe, expect, test } from 'vitest';

import { SuiteType, TestSuite } from '@/src/models/evaluation/test-suite';
import { normalizeRequestTemplate, normalizeTestSuitePayload } from '../test-suite-payload';

describe('normalizeTestSuitePayload', () => {
  test('omits jsonataContent when it is an empty string', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      requestTemplate: { urlTemplate: '/api', body: { contentType: 'application/json', jsonataContent: '' } },
    };

    const result = normalizeTestSuitePayload(suite);
    const body = result.requestTemplate!.body!;

    expect('jsonataContent' in body).toBe(false);
    expect(body.jsonataContent).not.toBe(null);
  });

  test('passes a non-empty expression through verbatim, including the seeded "{}"', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      requestTemplate: { urlTemplate: '/api', body: { contentType: 'application/json', jsonataContent: '{}' } },
    };

    const result = normalizeTestSuitePayload(suite);

    expect(result.requestTemplate!.body!.jsonataContent).toBe('{}');
  });

  test('passes a hand-written non-empty expression through verbatim', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      requestTemplate: {
        urlTemplate: '/api',
        body: { contentType: 'application/json', jsonataContent: '$sum(items.price)' },
      },
    };

    const result = normalizeTestSuitePayload(suite);

    expect(result.requestTemplate!.body!.jsonataContent).toBe('$sum(items.price)');
  });

  test('leaves a JSON-mode body with content untouched', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      requestTemplate: { urlTemplate: '/api', body: { contentType: 'application/json', content: { model: 'gpt-4' } } },
    };

    const result = normalizeTestSuitePayload(suite);

    expect(result).toEqual(suite);
  });

  test('returns a suite with no requestTemplate unchanged and does not throw', () => {
    const suite: TestSuite = { id: 'suite-1' };

    expect(() => normalizeTestSuitePayload(suite)).not.toThrow();
    expect(normalizeTestSuitePayload(suite)).toEqual(suite);
  });

  test('returns a requestTemplate with no body unchanged and does not throw', () => {
    const suite: TestSuite = { id: 'suite-1', requestTemplate: { urlTemplate: '/api' } };

    expect(() => normalizeTestSuitePayload(suite)).not.toThrow();
    expect(normalizeTestSuitePayload(suite)).toEqual(suite);
  });

  test('does not mutate the input object', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      requestTemplate: { urlTemplate: '/api', body: { contentType: 'application/json', jsonataContent: '' } },
    };

    normalizeTestSuitePayload(suite);

    expect(suite.requestTemplate!.body!.jsonataContent).toBe('');
  });

  test('omits jsonataContent for each additionalRequests entry', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      additionalRequests: [
        {
          name: 'Second',
          requestTemplate: { urlTemplate: '/second', body: { contentType: 'application/json', jsonataContent: '' } },
        },
        {
          name: 'Third',
          requestTemplate: {
            urlTemplate: '/third',
            body: { contentType: 'application/json', jsonataContent: '$sum(x)' },
          },
        },
      ],
    };

    const result = normalizeTestSuitePayload(suite);

    expect('jsonataContent' in result.additionalRequests![0].requestTemplate!.body!).toBe(false);
    expect(result.additionalRequests![1].requestTemplate!.body!.jsonataContent).toBe('$sum(x)');
  });

  test('does not mutate additionalRequests on the input object', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      additionalRequests: [
        {
          name: 'Second',
          requestTemplate: { urlTemplate: '/second', body: { contentType: 'application/json', jsonataContent: '' } },
        },
      ],
    };

    normalizeTestSuitePayload(suite);

    expect(suite.additionalRequests![0].requestTemplate!.body!.jsonataContent).toBe('');
  });

  test('leaves requestName and additionalRequests untouched for a DEPLOYMENT suite', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      suiteType: SuiteType.Deployment,
      requestName: 'Main',
      additionalRequests: [{ name: 'Second' }],
    };

    const result = normalizeTestSuitePayload(suite);

    expect(result.requestName).toBe('Main');
    expect(result.additionalRequests).toEqual([{ name: 'Second' }]);
  });

  test('strips requestName and additionalRequests for an MCP_TOOL suite', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      suiteType: SuiteType.McpTool,
      requestName: 'Main',
      additionalRequests: [{ name: 'Second' }],
    };

    const result = normalizeTestSuitePayload(suite);

    expect('requestName' in result).toBe(false);
    expect('additionalRequests' in result).toBe(false);
  });
});

describe('normalizeRequestTemplate', () => {
  test('returns undefined unchanged', () => {
    expect(normalizeRequestTemplate(undefined)).toBeUndefined();
  });

  test('omits jsonataContent when it is an empty string', () => {
    const template = { urlTemplate: '/api', body: { contentType: 'application/json', jsonataContent: '' } };

    const result = normalizeRequestTemplate(template);

    expect('jsonataContent' in result!.body!).toBe(false);
  });

  test('passes a non-empty jsonataContent through verbatim', () => {
    const template = { urlTemplate: '/api', body: { contentType: 'application/json', jsonataContent: '{}' } };

    expect(normalizeRequestTemplate(template)!.body!.jsonataContent).toBe('{}');
  });

  test('returns a template with no body unchanged', () => {
    const template = { urlTemplate: '/api' };

    expect(normalizeRequestTemplate(template)).toEqual(template);
  });
});
