import { describe, expect, test } from 'vitest';

import { ResponseColumn } from '@/src/models/evaluation/test-suite';
import { evaluateColumns, EvaluatedColumn } from '../evaluate-columns';

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

  test('should mix valid and invalid columns in one call', async () => {
    const columns = [
      makeColumn({ name: 'ok', expression: 'model', type: 'STRING' }),
      makeColumn({ name: 'missing', expression: 'does.not.exist', type: 'STRING' }),
      makeColumn({ name: 'bad', expression: '[[[', type: 'STRING' }),
    ];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].valid).toBe(true);
    expect(results[1].valid).toBe(false);
    expect(results[2].valid).toBe(false);
  });
});
