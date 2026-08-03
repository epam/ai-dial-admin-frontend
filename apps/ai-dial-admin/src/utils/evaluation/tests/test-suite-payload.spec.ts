import { describe, expect, test } from 'vitest';

import { TestSuite } from '@/src/models/evaluation/test-suite';
import { normalizeTestSuitePayload } from '../test-suite-payload';

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
});
