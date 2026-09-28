import { describe, expect, test } from 'vitest';

import { reseedAnthropicMessagesModel } from '@/src/components/TestSuites/utils/anthropic-messages-model';
import { TestSuite } from '@/src/models/evaluation/test-suite';

const createMessageSuite = (
  content: Record<string, unknown> = { model: 'claude-3-opus', max_tokens: 1024, messages: [] },
): TestSuite =>
  ({
    endpointRef: { method: 'POST', relativeUrlPattern: '/anthropic/v1/messages' },
    requestTemplate: {
      urlTemplate: '/anthropic/v1/messages',
      body: { contentType: 'application/json', content },
    },
  }) as TestSuite;

describe('reseedAnthropicMessagesModel', () => {
  test('rewrites model to the new deployment id', () => {
    const result = reseedAnthropicMessagesModel(createMessageSuite(), 'claude-3-sonnet');

    expect(result.requestTemplate?.body?.content).toEqual({
      model: 'claude-3-sonnet',
      max_tokens: 1024,
      messages: [],
    });
  });

  test('preserves hand-added body fields', () => {
    const suite = createMessageSuite({
      model: 'claude-3-opus',
      max_tokens: 1024,
      messages: [],
      system: 'be terse',
      temperature: 0.5,
    });

    expect(reseedAnthropicMessagesModel(suite, 'claude-3-sonnet').requestTemplate?.body?.content).toEqual({
      model: 'claude-3-sonnet',
      max_tokens: 1024,
      messages: [],
      system: 'be terse',
      temperature: 0.5,
    });
  });

  test('adds model when the body has none', () => {
    const result = reseedAnthropicMessagesModel(
      createMessageSuite({ max_tokens: 1024, messages: [] }),
      'claude-3-sonnet',
    );

    expect(result.requestTemplate?.body?.content).toEqual({
      model: 'claude-3-sonnet',
      max_tokens: 1024,
      messages: [],
    });
  });

  test('leaves a chat-completion suite untouched', () => {
    const suite = {
      endpointRef: { method: 'POST', relativeUrlPattern: '/chat/completions' },
      requestTemplate: { body: { content: { model: 'claude-3-opus', messages: [] } } },
    } as TestSuite;

    expect(reseedAnthropicMessagesModel(suite, 'claude-3-sonnet')).toBe(suite);
  });

  test('leaves a route-derived suite untouched', () => {
    const suite = {
      endpointRef: { method: 'GET', relativeUrlPattern: '/api/users' },
      requestTemplate: { body: { content: { model: 'claude-3-opus' } } },
    } as TestSuite;

    expect(reseedAnthropicMessagesModel(suite, 'claude-3-sonnet')).toBe(suite);
  });

  test('leaves a form-data body untouched', () => {
    const suite = {
      endpointRef: { method: 'POST', relativeUrlPattern: '/anthropic/v1/messages' },
      requestTemplate: { body: { contentType: 'multipart/form-data', content: [{ key: 'a', value: 'b' }] } },
    } as unknown as TestSuite;

    expect(reseedAnthropicMessagesModel(suite, 'claude-3-sonnet').requestTemplate?.body?.content).toEqual([
      { key: 'a', value: 'b' },
    ]);
  });

  test('returns the suite unchanged when there is no deployment id', () => {
    const suite = createMessageSuite();

    expect(reseedAnthropicMessagesModel(suite, '')).toBe(suite);
  });

  test('rewrites model in a chained create-message request', () => {
    const suite = {
      endpointRef: { method: 'POST', relativeUrlPattern: '/chat/completions' },
      requestTemplate: { body: { content: { messages: [] } } },
      additionalRequests: [
        {
          name: 'create',
          endpointRef: { method: 'POST', relativeUrlPattern: '/anthropic/v1/messages' },
          requestTemplate: { body: { content: { model: 'claude-3-opus', max_tokens: 1024, messages: [] } } },
        },
      ],
    } as TestSuite;

    const result = reseedAnthropicMessagesModel(suite, 'claude-3-sonnet');

    expect(result.additionalRequests?.[0].requestTemplate?.body?.content).toEqual({
      model: 'claude-3-sonnet',
      max_tokens: 1024,
      messages: [],
    });
    expect(result.requestTemplate?.body?.content).toEqual({ messages: [] });
  });

  test('does not mutate its input', () => {
    const suite = createMessageSuite();

    reseedAnthropicMessagesModel(suite, 'claude-3-sonnet');

    expect(suite.requestTemplate?.body?.content).toEqual({
      model: 'claude-3-opus',
      max_tokens: 1024,
      messages: [],
    });
  });
});
