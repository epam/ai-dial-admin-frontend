import { describe, expect, test } from 'vitest';

import { reseedResponsesModel } from '@/src/components/TestSuites/utils/responses-model';
import { TestSuite } from '@/src/models/evaluation/test-suite';

const createResponseSuite = (content: Record<string, unknown> = { model: 'gpt-4o', input: 'hi' }): TestSuite =>
  ({
    endpointRef: { method: 'POST', relativeUrlPattern: '/openai/v1/responses' },
    requestTemplate: {
      urlTemplate: '/openai/v1/responses',
      body: { contentType: 'application/json', content },
    },
  }) as TestSuite;

describe('reseedResponsesModel', () => {
  test('rewrites model to the new deployment id', () => {
    const result = reseedResponsesModel(createResponseSuite(), 'claude-3');

    expect(result.requestTemplate?.body?.content).toEqual({ model: 'claude-3', input: 'hi' });
  });

  test('preserves hand-added body fields', () => {
    const suite = createResponseSuite({ model: 'gpt-4o', input: 'hi', store: true, conversation_id: 'c1' });

    expect(reseedResponsesModel(suite, 'claude-3').requestTemplate?.body?.content).toEqual({
      model: 'claude-3',
      input: 'hi',
      store: true,
      conversation_id: 'c1',
    });
  });

  test('adds model when the body has none', () => {
    const result = reseedResponsesModel(createResponseSuite({ input: 'hi' }), 'claude-3');

    expect(result.requestTemplate?.body?.content).toEqual({ model: 'claude-3', input: 'hi' });
  });

  test('leaves a chat-completion suite untouched', () => {
    const suite = {
      endpointRef: { method: 'POST', relativeUrlPattern: '/chat/completions' },
      requestTemplate: { body: { content: { model: 'gpt-4o', messages: [] } } },
    } as TestSuite;

    expect(reseedResponsesModel(suite, 'claude-3')).toBe(suite);
  });

  test('leaves a route-derived suite untouched', () => {
    const suite = {
      endpointRef: { method: 'GET', relativeUrlPattern: '/api/users' },
      requestTemplate: { body: { content: { model: 'gpt-4o' } } },
    } as TestSuite;

    expect(reseedResponsesModel(suite, 'claude-3')).toBe(suite);
  });

  test('leaves a response-scoped suite untouched, since it carries no model', () => {
    const suite = {
      endpointRef: { method: 'GET', relativeUrlPattern: '/openai/v1/responses/[^/]+' },
      requestTemplate: { urlTemplate: '/openai/v1/responses/${{response_id}}', body: { content: {} } },
    } as TestSuite;

    expect(reseedResponsesModel(suite, 'claude-3')).toBe(suite);
  });

  test('leaves a form-data body untouched', () => {
    const suite = {
      endpointRef: { method: 'POST', relativeUrlPattern: '/openai/v1/responses' },
      requestTemplate: { body: { contentType: 'multipart/form-data', content: [{ key: 'a', value: 'b' }] } },
    } as unknown as TestSuite;

    expect(reseedResponsesModel(suite, 'claude-3').requestTemplate?.body?.content).toEqual([{ key: 'a', value: 'b' }]);
  });

  test('returns the suite unchanged when there is no deployment id', () => {
    const suite = createResponseSuite();

    expect(reseedResponsesModel(suite, '')).toBe(suite);
  });

  test('rewrites model in a chained create-response request', () => {
    const suite = {
      endpointRef: { method: 'POST', relativeUrlPattern: '/chat/completions' },
      requestTemplate: { body: { content: { messages: [] } } },
      additionalRequests: [
        {
          name: 'create',
          endpointRef: { method: 'POST', relativeUrlPattern: '/openai/v1/responses' },
          requestTemplate: { body: { content: { model: 'gpt-4o', input: 'hi' } } },
        },
      ],
    } as TestSuite;

    const result = reseedResponsesModel(suite, 'claude-3');

    expect(result.additionalRequests?.[0].requestTemplate?.body?.content).toEqual({
      model: 'claude-3',
      input: 'hi',
    });
    expect(result.requestTemplate?.body?.content).toEqual({ messages: [] });
  });

  test('does not mutate its input', () => {
    const suite = createResponseSuite();

    reseedResponsesModel(suite, 'claude-3');

    expect(suite.requestTemplate?.body?.content).toEqual({ model: 'gpt-4o', input: 'hi' });
  });
});
