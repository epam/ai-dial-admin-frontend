import { describe, expect, test } from 'vitest';

import { ResponseColumn, TestSuite, TryOutHistoryEntry } from '@/src/models/evaluation/test-suite';
import { evaluateColumns, evaluateTryOutColumnSections, EvaluatedColumn } from '../evaluate-columns';

const makeColumn = (overrides: Partial<ResponseColumn> = {}): ResponseColumn => ({
  name: 'answer',
  displayName: 'answer',
  expression: 'choices[0].message.content',
  type: 'STRING',
  ...overrides,
});

const chatResponse = {
  choices: [
    {
      index: 0,
      finish_reason: 'stop',
      message: {
        role: 'assistant',
        content: 'The capital of Belarus is Minsk.',
      },
    },
  ],
  usage: {
    prompt_tokens: 730,
    completion_tokens: 9,
    total_tokens: 739,
  },
  id: '66ca3e76-a05a-48d8-90a3-eccce6d4ec8e',
  created: 1775136303,
  object: 'chat.completion',
  model: 'gpt-4.1-2025-04-14',
};

describe('evaluateColumns', () => {
  test('should resolve a simple nested path expression', async () => {
    const columns = [makeColumn()];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results).toEqual<EvaluatedColumn[]>([
      {
        name: 'answer',
        expression: 'choices[0].message.content',
        type: 'STRING',
        result: 'The capital of Belarus is Minsk.',
        valid: true,
      },
    ]);
  });

  test('should resolve a numeric field', async () => {
    const columns = [makeColumn({ name: 'tokens', expression: 'usage.total_tokens', type: 'NUMBER' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results).toHaveLength(1);
    expect(results[0].result).toBe('739');
    expect(results[0].valid).toBe(true);
    expect(results[0].type).toBe('NUMBER');
  });

  test('should resolve top-level field', async () => {
    const columns = [makeColumn({ name: 'model', expression: 'model', type: 'STRING' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('gpt-4.1-2025-04-14');
    expect(results[0].valid).toBe(true);
  });

  test('should return valid=false and result=empty string for non-existent path', async () => {
    const columns = [makeColumn({ expression: 'nonexistent.path' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('');
    expect(results[0].valid).toBe(false);
  });

  test('should return valid=false and result=empty string for invalid expression syntax', async () => {
    const columns = [makeColumn({ expression: '[[[invalid' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('');
    expect(results[0].valid).toBe(false);
  });

  test('should handle multiple columns in parallel', async () => {
    const columns = [
      makeColumn({ name: 'answer', expression: 'choices[0].message.content', type: 'STRING' }),
      makeColumn({ name: 'model', expression: 'model', type: 'STRING' }),
      makeColumn({ name: 'tokens', expression: 'usage.total_tokens', type: 'NUMBER' }),
    ];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results).toHaveLength(3);
    expect(results[0]).toMatchObject({ name: 'answer', result: 'The capital of Belarus is Minsk.', valid: true });
    expect(results[1]).toMatchObject({ name: 'model', result: 'gpt-4.1-2025-04-14', valid: true });
    expect(results[2]).toMatchObject({ name: 'tokens', result: '739', valid: true });
  });

  test('should return empty array when columns array is empty', async () => {
    const results = await evaluateColumns([], chatResponse);

    expect(results).toEqual([]);
  });

  test('should handle empty response object', async () => {
    const columns = [makeColumn()];

    const results = await evaluateColumns(columns, {});

    expect(results[0].result).toBe('');
    expect(results[0].valid).toBe(false);
  });

  test('should handle JSONata function expressions', async () => {
    const columns = [makeColumn({ name: 'count', expression: '$count(choices)', type: 'NUMBER' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('1');
    expect(results[0].valid).toBe(true);
  });

  test('should handle JSONata string function expressions', async () => {
    const columns = [makeColumn({ name: 'upper', expression: '$uppercase(choices[0].message.role)', type: 'STRING' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('ASSISTANT');
    expect(results[0].valid).toBe(true);
  });

  test('should handle JSONata arithmetic expressions', async () => {
    const columns = [
      makeColumn({ name: 'sum', expression: 'usage.prompt_tokens + usage.completion_tokens', type: 'NUMBER' }),
    ];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('739');
    expect(results[0].valid).toBe(true);
  });

  test('should preserve name, expression, and type from column even on failure', async () => {
    const columns = [makeColumn({ name: 'broken', expression: '!!!', type: 'CUSTOM' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].name).toBe('broken');
    expect(results[0].expression).toBe('!!!');
    expect(results[0].type).toBe('CUSTOM');
    expect(results[0].valid).toBe(false);
  });

  test('should handle expression that evaluates to boolean false as valid', async () => {
    const response = { flag: false };
    const columns = [makeColumn({ expression: 'flag', type: 'BOOLEAN' })];

    const results = await evaluateColumns(columns, response);

    expect(results[0].result).toBe('false');
    expect(results[0].valid).toBe(true);
  });

  test('should handle expression that evaluates to 0 as valid', async () => {
    const response = { count: 0 };
    const columns = [makeColumn({ expression: 'count', type: 'NUMBER' })];

    const results = await evaluateColumns(columns, response);

    expect(results[0].result).toBe('0');
    expect(results[0].valid).toBe(true);
  });

  test('should handle expression that evaluates to empty string as valid', async () => {
    const response = { text: '' };
    const columns = [makeColumn({ expression: 'text', type: 'STRING' })];

    const results = await evaluateColumns(columns, response);

    expect(results[0].result).toBe('');
    expect(results[0].valid).toBe(true);
  });

  test('should still resolve a body-relative expression when a request is also supplied (regression guard)', async () => {
    const columns = [makeColumn()];
    const request = { messages: [{ content: 'Hi' }] };

    const results = await evaluateColumns(columns, chatResponse, request);

    expect(results[0].result).toBe('The capital of Belarus is Minsk.');
    expect(results[0].valid).toBe(true);
  });

  test('should resolve $response.<field> to the same value as the bare field', async () => {
    const columns = [makeColumn({ name: 'viaResponse', expression: '$response.choices[0].message.content' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('The capital of Belarus is Minsk.');
    expect(results[0].valid).toBe(true);
  });

  test('should resolve $request to the request body verbatim, and a nested path within it', async () => {
    const request = { messages: [{ content: 'Hi there' }], model: 'gpt-4' };
    const columns = [
      makeColumn({ name: 'wholeRequest', expression: '$request' }),
      makeColumn({ name: 'reqBodyField', expression: '$request.messages[0].content' }),
    ];

    const results = await evaluateColumns(columns, chatResponse, request);

    expect(results[0].result).toBe(JSON.stringify(request));
    expect(results[0].valid).toBe(true);
    expect(results[1].result).toBe('Hi there');
    expect(results[1].valid).toBe(true);
  });

  test('should fall into the invalid/empty-result path for $request when no request was supplied', async () => {
    const columns = [makeColumn({ name: 'reqField', expression: '$request.messages[0].content' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('');
    expect(results[0].valid).toBe(false);
  });

  test('should support function composition over the $request binding', async () => {
    const request = { messages: [{ content: 'a' }, { content: 'b' }] };
    const columns = [makeColumn({ name: 'msgCount', expression: '$count($request.messages)', type: 'NUMBER' })];

    const results = await evaluateColumns(columns, chatResponse, request);

    expect(results[0].result).toBe('2');
    expect(results[0].valid).toBe(true);
  });

  test('should resolve $_request / $_response aliases used by backend column expressions', async () => {
    const request = { messages: [{ role: 'user', content: 'Hi' }] };
    const columns = [
      makeColumn({
        name: 'history',
        expression: '$append($_request.messages, [$_response.choices[-1].message])',
      }),
      makeColumn({ name: 'answer', expression: '$_response.choices[-1].message.content' }),
    ];

    const results = await evaluateColumns(columns, chatResponse, request);

    expect(results[0].valid).toBe(true);
    expect(JSON.parse(results[0].result)).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'The capital of Belarus is Minsk.' },
    ]);
    expect(results[1].result).toBe('The capital of Belarus is Minsk.');
    expect(results[1].valid).toBe(true);
  });

  test('should resolve $answer from extraBindings passed by a prior request evaluation', async () => {
    const columns = [makeColumn({ name: 'followUp', expression: '$answer', type: 'STRING' })];
    const response = { choices: [{ message: { content: 'later' } }] };

    const results = await evaluateColumns(columns, response, undefined, { answer: 'from request 0' });

    expect(results[0].result).toBe('from request 0');
    expect(results[0].valid).toBe(true);
  });
});

describe('evaluateTryOutColumnSections', () => {
  const chatResponse = {
    choices: [{ message: { content: 'Paris' } }],
  };

  test('returns grouped results for a three-request chain with history', async () => {
    const suite: TestSuite = {
      responseColumns: [makeColumn({ name: 'answer', expression: 'choices[0].message.content' })],
      additionalRequests: [
        {
          responseColumns: [makeColumn({ name: 'is_correct', expression: '$answer = "Paris"' })],
        },
        {
          responseColumns: [makeColumn({ name: 'result', expression: '$answer' })],
        },
      ],
    };

    const history: TryOutHistoryEntry[] = [
      {
        resolvedRequest: { body: { contentType: 'application/json', content: { q: 1 } } },
        response: { body: chatResponse },
      },
      {
        resolvedRequest: { body: { contentType: 'application/json', content: { q: 2 } } },
        response: { body: { ok: true } },
      },
      {
        resolvedRequest: { body: { contentType: 'application/json', content: { q: 3 } } },
        response: { body: { done: true } },
      },
    ];

    const results = await evaluateTryOutColumnSections({
      testSuite: suite,
      history,
      schema: [],
      multiTurnLength: 1,
    });

    expect(results.shape).toBe('requests');
    expect(results.groups).toHaveLength(3);
    expect(results.groups?.[0].turns[0].columns[0].result).toBe('Paris');
    expect(results.groups?.[1].turns[0].columns[0].valid).toBe(true);
    expect(results.groups?.[2].turns[0].columns[0].result).toBe('Paris');
  });

  test('falls back to flat request #0 columns when history is absent', async () => {
    const suite: TestSuite = {
      responseColumns: [makeColumn({ name: 'answer', expression: 'choices[0].message.content' })],
    };

    const results = await evaluateTryOutColumnSections({
      testSuite: suite,
      fallbackColumns: suite.responseColumns,
      fallbackResponse: chatResponse,
    });

    expect(results.shape).toBe('single');
    expect(results.flatColumns?.[0].result).toBe('Paris');
  });
});
