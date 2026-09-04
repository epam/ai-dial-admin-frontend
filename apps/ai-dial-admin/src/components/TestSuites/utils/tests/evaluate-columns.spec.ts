import { describe, expect, test } from 'vitest';

import {
  ResponseColumn,
  StreamingStatus,
  SuiteType,
  TestSuite,
  TryOutHistoryEntry,
} from '@/src/models/evaluation/test-suite';
import { normalizeResponseBodyForColumns } from '../column-eval-context';
import { evaluateColumns, evaluateTryOutColumnSections } from '../evaluate-columns';
import { ColumnExtractionStatus, EvaluatedColumn, NotExtractedReason } from '../models';

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

const mcpSuite: TestSuite = { suiteType: SuiteType.McpTool };
const deploymentSuite: TestSuite = { suiteType: SuiteType.Deployment };

// evaluateColumns is the MCP fallback: the one path whose try-out reports no extraction of its own.
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
        status: ColumnExtractionStatus.Extracted,
      },
    ]);
  });

  test('should resolve a numeric field', async () => {
    const columns = [makeColumn({ name: 'tokens', expression: 'usage.total_tokens', type: 'NUMBER' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results).toHaveLength(1);
    expect(results[0].result).toBe('739');
    expect(results[0].status).toBe(ColumnExtractionStatus.Extracted);
    expect(results[0].type).toBe('NUMBER');
  });

  test('should resolve top-level field', async () => {
    const columns = [makeColumn({ name: 'model', expression: 'model', type: 'STRING' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('gpt-4.1-2025-04-14');
    expect(results[0].status).toBe(ColumnExtractionStatus.Extracted);
  });

  test('should fail with an empty result for a non-existent path', async () => {
    const columns = [makeColumn({ expression: 'nonexistent.path' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('');
    expect(results[0].status).toBe(ColumnExtractionStatus.Failed);
  });

  test('should fail with an empty result for invalid expression syntax', async () => {
    const columns = [makeColumn({ expression: '[[[invalid' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('');
    expect(results[0].status).toBe(ColumnExtractionStatus.Failed);
  });

  test('should handle multiple columns in parallel', async () => {
    const columns = [
      makeColumn({ name: 'answer', expression: 'choices[0].message.content', type: 'STRING' }),
      makeColumn({ name: 'model', expression: 'model', type: 'STRING' }),
      makeColumn({ name: 'tokens', expression: 'usage.total_tokens', type: 'NUMBER' }),
    ];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results).toHaveLength(3);
    expect(results.map(({ name, result }) => [name, result])).toEqual([
      ['answer', 'The capital of Belarus is Minsk.'],
      ['model', 'gpt-4.1-2025-04-14'],
      ['tokens', '739'],
    ]);
    expect(results.every(({ status }) => status === ColumnExtractionStatus.Extracted)).toBe(true);
  });

  test('should return empty array when columns array is empty', async () => {
    const results = await evaluateColumns([], chatResponse);

    expect(results).toEqual([]);
  });

  test('should handle empty response object', async () => {
    const columns = [makeColumn()];

    const results = await evaluateColumns(columns, {});

    expect(results[0].result).toBe('');
    expect(results[0].status).toBe(ColumnExtractionStatus.Failed);
  });

  test('should handle JSONata function expressions', async () => {
    const columns = [makeColumn({ name: 'count', expression: '$count(choices)', type: 'NUMBER' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('1');
    expect(results[0].status).toBe(ColumnExtractionStatus.Extracted);
  });

  test('should handle JSONata string function expressions', async () => {
    const columns = [makeColumn({ name: 'upper', expression: '$uppercase(choices[0].message.role)', type: 'STRING' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('ASSISTANT');
    expect(results[0].status).toBe(ColumnExtractionStatus.Extracted);
  });

  test('should handle JSONata arithmetic expressions', async () => {
    const columns = [
      makeColumn({ name: 'sum', expression: 'usage.prompt_tokens + usage.completion_tokens', type: 'NUMBER' }),
    ];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('739');
    expect(results[0].status).toBe(ColumnExtractionStatus.Extracted);
  });

  test('should preserve name, expression, and type from column even on failure', async () => {
    const columns = [makeColumn({ name: 'broken', expression: '!!!', type: 'CUSTOM' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0]).toMatchObject({
      name: 'broken',
      expression: '!!!',
      type: 'CUSTOM',
      status: ColumnExtractionStatus.Failed,
    });
  });

  test.each([
    ['boolean false', { flag: false }, 'flag', 'false'],
    ['0', { count: 0 }, 'count', '0'],
    ['an empty string', { text: '' }, 'text', ''],
  ])('should treat %s as extracted', async (_label, response, expression, expected) => {
    const results = await evaluateColumns([makeColumn({ expression })], response);

    expect(results[0].result).toBe(expected);
    expect(results[0].status).toBe(ColumnExtractionStatus.Extracted);
  });

  test('should still resolve a body-relative expression when a request is also supplied (regression guard)', async () => {
    const columns = [makeColumn()];
    const request = { messages: [{ content: 'Hi' }] };

    const results = await evaluateColumns(columns, chatResponse, request);

    expect(results[0].result).toBe('The capital of Belarus is Minsk.');
    expect(results[0].status).toBe(ColumnExtractionStatus.Extracted);
  });

  test('should resolve $response.<field> to the same value as the bare field', async () => {
    const columns = [makeColumn({ name: 'viaResponse', expression: '$response.choices[0].message.content' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('The capital of Belarus is Minsk.');
    expect(results[0].status).toBe(ColumnExtractionStatus.Extracted);
  });

  test('should resolve $request to the request body verbatim, and a nested path within it', async () => {
    const request = { messages: [{ content: 'Hi there' }], model: 'gpt-4' };
    const columns = [
      makeColumn({ name: 'wholeRequest', expression: '$request' }),
      makeColumn({ name: 'reqBodyField', expression: '$request.messages[0].content' }),
    ];

    const results = await evaluateColumns(columns, chatResponse, request);

    expect(results[0].result).toBe(JSON.stringify(request));
    expect(results[1].result).toBe('Hi there');
    expect(results.every(({ status }) => status === ColumnExtractionStatus.Extracted)).toBe(true);
  });

  test('should fail for $request when no request was supplied', async () => {
    const columns = [makeColumn({ name: 'reqField', expression: '$request.messages[0].content' })];

    const results = await evaluateColumns(columns, chatResponse);

    expect(results[0].result).toBe('');
    expect(results[0].status).toBe(ColumnExtractionStatus.Failed);
  });

  test('should support function composition over the $request binding', async () => {
    const request = { messages: [{ content: 'a' }, { content: 'b' }] };
    const columns = [makeColumn({ name: 'msgCount', expression: '$count($request.messages)', type: 'NUMBER' })];

    const results = await evaluateColumns(columns, chatResponse, request);

    expect(results[0].result).toBe('2');
    expect(results[0].status).toBe(ColumnExtractionStatus.Extracted);
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

    expect(JSON.parse(results[0].result)).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'The capital of Belarus is Minsk.' },
    ]);
    expect(results[1].result).toBe('The capital of Belarus is Minsk.');
    expect(results.every(({ status }) => status === ColumnExtractionStatus.Extracted)).toBe(true);
  });

  /**
   * Why the backend path exists: the Responses API SSE envelope is not a shape client-side evaluation
   * understands, so even the trivial `id` resolves to nothing. This is the state the Columns tab
   * displayed before it read the reported extraction.
   */
  test('cannot resolve a Responses API SSE envelope, not even a top-level field', async () => {
    const sseBody = {
      events: [
        { event: 'response.created', data: { response: { id: 'dial_gpt-5.6-sol' } } },
        { event: 'response.output_text.delta', data: { delta: 'Hi ' } },
      ],
    };
    const columns = [
      makeColumn({ expression: "$join(output[type='message'].content[type='output_text'].text)" }),
      makeColumn({ name: 'id', expression: 'id' }),
    ];

    const results = await evaluateColumns(columns, normalizeResponseBodyForColumns(sseBody) ?? {});

    expect(results.map(({ name, status }) => [name, status])).toEqual([
      ['answer', ColumnExtractionStatus.Failed],
      ['id', ColumnExtractionStatus.Failed],
    ]);
  });
});

describe('evaluateTryOutColumnSections', () => {
  const entry = (overrides: Partial<TryOutHistoryEntry>): TryOutHistoryEntry => ({
    resolvedRequest: { body: { contentType: 'application/json', content: {} } },
    response: { statusCode: 200, body: {} },
    ...overrides,
  });

  const chainSuite: TestSuite = {
    suiteType: SuiteType.Deployment,
    responseColumns: [makeColumn({ name: 'answer' })],
    additionalRequests: [
      { responseColumns: [makeColumn({ name: 'is_correct', expression: '$answer = "Paris"' })] },
      { responseColumns: [makeColumn({ name: 'result', expression: '$answer' })] },
    ],
  };

  describe('a multi-request chain', () => {
    test("shows each request's own reported extraction", async () => {
      const history = [
        entry({ extractedColumns: { answer: 'Paris' } }),
        entry({ extractedColumns: { is_correct: true } }),
        entry({ extractedColumns: { result: 'Paris' } }),
      ];

      const results = await evaluateTryOutColumnSections({
        testSuite: chainSuite,
        history,
        schema: [],
        multiTurnLength: 1,
      });

      expect(results.shape).toBe('requests');
      expect(results.groups).toHaveLength(3);
      expect(results.groups?.map((group) => group.turns[0].columns[0].result)).toEqual(['Paris', 'true', 'Paris']);
      expect(
        results.groups?.every((group) => group.turns[0].columns[0].status === ColumnExtractionStatus.Extracted),
      ).toBe(true);
    });

    // `$answer` refers to request #0's column; the backend already reconciled it, so nothing here does.
    test("takes a later request's cross-request column value from its own reported extraction", async () => {
      const history = [
        entry({ extractedColumns: { answer: 'Paris' } }),
        entry({ extractedColumns: { is_correct: true } }),
        entry({ extractedColumns: { result: 'Paris' } }),
      ];

      const results = await evaluateTryOutColumnSections({
        testSuite: chainSuite,
        history,
        schema: [],
        multiTurnLength: 1,
      });

      expect(results.groups?.[1].turns[0]).toMatchObject({
        columns: [expect.objectContaining({ name: 'is_correct', result: 'true' })],
      });
    });

    test('shows results only for the invocations that ran when a chain stopped early', async () => {
      const history = [
        entry({ extractedColumns: { answer: 'Paris' } }),
        entry({ response: { statusCode: 500, body: { error: 'boom' } } }),
      ];

      const results = await evaluateTryOutColumnSections({
        testSuite: chainSuite,
        history,
        schema: [],
        multiTurnLength: 1,
      });

      expect(results.groups).toHaveLength(2);
      expect(results.groups?.map(({ requestIndex }) => requestIndex)).toEqual([0, 1]);
      expect(results.groups?.[1].turns[0].columns[0]).toMatchObject({
        status: ColumnExtractionStatus.NotExtracted,
        reason: NotExtractedReason.RequestFailed,
        statusCode: 500,
      });
    });
  });

  describe('per-turn sections', () => {
    const combinedSuite: TestSuite = {
      suiteType: SuiteType.Deployment,
      responseColumns: [makeColumn({ name: 'answer' })],
      inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }],
      additionalRequests: [
        {
          responseColumns: [makeColumn({ name: 'is_correct' })],
          inputBindings: [{ templateVariable: 'prompt', dataField: 'prompt' }],
        },
      ],
    };

    test("each turn shows that turn's own extracted values", async () => {
      const history = [
        entry({ requestIndex: 0, turnIndex: 0, extractedColumns: { answer: 'first' } }),
        entry({ requestIndex: 0, turnIndex: 1, extractedColumns: { answer: 'second' } }),
        entry({ requestIndex: 1, turnIndex: 0, extractedColumns: { is_correct: false } }),
      ];

      const results = await evaluateTryOutColumnSections({
        testSuite: combinedSuite,
        history,
        schema: [{ name: 'prompt', perTurn: true } as never],
        multiTurnLength: 2,
      });

      expect(results.shape).toBe('combined');
      expect(results.groups?.[0].turns.map(({ columns }) => columns[0].result)).toEqual(['first', 'second']);
      expect(results.groups?.[1].turns[0].columns[0].result).toBe('false');
    });
  });

  describe('the single-invocation case', () => {
    test("takes its values from the envelope's own extraction", async () => {
      const results = await evaluateTryOutColumnSections({
        testSuite: deploymentSuite,
        fallbackColumns: [makeColumn(), makeColumn({ name: 'id', expression: 'id' })],
        fallbackInvocation: {
          response: { statusCode: 200 },
          extractedColumns: { answer: 'Hi there, friend!', id: 'dial_gpt' },
          extractionWarnings: [],
        },
      });

      expect(results.shape).toBe('single');
      expect(results.flatColumns?.map(({ result }) => result)).toEqual(['Hi there, friend!', 'dial_gpt']);
    });

    test('reports a failed invocation as not extracted', async () => {
      const results = await evaluateTryOutColumnSections({
        testSuite: deploymentSuite,
        fallbackColumns: [makeColumn()],
        fallbackInvocation: { response: { statusCode: 401 } },
      });

      expect(results.flatColumns?.[0]).toMatchObject({
        status: ColumnExtractionStatus.NotExtracted,
        reason: NotExtractedReason.RequestFailed,
        statusCode: 401,
      });
    });

    test('reports an abnormally terminated stream as not extracted', async () => {
      const results = await evaluateTryOutColumnSections({
        testSuite: deploymentSuite,
        fallbackColumns: [makeColumn()],
        fallbackInvocation: {
          response: { statusCode: 200, streaming: true, streamingStatus: StreamingStatus.Timeout },
        },
      });

      expect(results.flatColumns?.[0].reason).toBe(NotExtractedReason.StreamIncomplete);
    });

    test('renders nothing before a request has been sent', async () => {
      const results = await evaluateTryOutColumnSections({
        testSuite: deploymentSuite,
        fallbackColumns: [makeColumn()],
      });

      expect(results.flatColumns).toEqual([]);
    });
  });

  describe('client-side evaluation', () => {
    test('an MCP suite still evaluates its expressions locally', async () => {
      const results = await evaluateTryOutColumnSections({
        testSuite: mcpSuite,
        fallbackColumns: [makeColumn()],
        fallbackResponse: chatResponse,
      });

      expect(results.flatColumns?.[0]).toMatchObject({
        result: 'The capital of Belarus is Minsk.',
        status: ColumnExtractionStatus.Extracted,
      });
    });

    test('an MCP suite renders nothing before a request has been sent', async () => {
      const results = await evaluateTryOutColumnSections({
        testSuite: mcpSuite,
        fallbackColumns: [makeColumn()],
      });

      expect(results.flatColumns).toEqual([]);
    });

    // The expression would resolve against this body; a non-MCP suite must not try it.
    test('a non-MCP suite never evaluates locally, even when the expression would resolve', async () => {
      const results = await evaluateTryOutColumnSections({
        testSuite: deploymentSuite,
        fallbackColumns: [makeColumn()],
        fallbackInvocation: { response: { statusCode: 200, body: chatResponse } },
        fallbackResponse: chatResponse,
      });

      expect(results.flatColumns?.[0]).toMatchObject({
        result: '',
        status: ColumnExtractionStatus.NotExtracted,
      });
    });

    test('a non-MCP failed invocation never evaluates locally against the error body', async () => {
      const results = await evaluateTryOutColumnSections({
        testSuite: deploymentSuite,
        fallbackColumns: [makeColumn({ name: 'err', expression: 'error' })],
        fallbackInvocation: { response: { statusCode: 500, body: { error: 'boom' } } },
        fallbackResponse: { error: 'boom' },
      });

      expect(results.flatColumns?.[0]).toMatchObject({
        result: '',
        status: ColumnExtractionStatus.NotExtracted,
        reason: NotExtractedReason.RequestFailed,
      });
    });
  });
});
