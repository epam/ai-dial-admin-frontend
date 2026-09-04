import { describe, expect, test } from 'vitest';

import { formatExtractedValue, resolveInvocationColumns } from '../column-extraction';
import { ColumnExtractionStatus, NotExtractedReason, TryOutInvocation } from '../models';
import { ResponseColumn, StreamingStatus, TryOutResponse } from '@/src/models/evaluation/test-suite';

const column = (overrides: Partial<ResponseColumn> = {}): ResponseColumn => ({
  name: 'answer',
  displayName: 'answer',
  expression: "$join(output[type='message'].content[type='output_text'].text)",
  type: 'STRING',
  ...overrides,
});

const invocation = (overrides: Partial<TryOutInvocation> = {}): TryOutInvocation => ({
  response: { statusCode: 200 },
  ...overrides,
});

describe('formatExtractedValue', () => {
  test('returns a string verbatim', () => {
    expect(formatExtractedValue('Hi there, friend!')).toBe('Hi there, friend!');
  });

  test.each([
    ['a number', 42, '42'],
    ['zero', 0, '0'],
    ['false', false, 'false'],
    ['true', true, 'true'],
    ['an empty string', '', ''],
    ['an object', { a: 1 }, '{"a":1}'],
    ['an array', [1, 'two'], '[1,"two"]'],
  ])('formats %s', (_label, value, expected) => {
    expect(formatExtractedValue(value)).toBe(expected);
  });
});

describe('resolveInvocationColumns', () => {
  test('a reported value is extracted', () => {
    const results = resolveInvocationColumns(
      [column()],
      invocation({ extractedColumns: { answer: 'Hi there, friend!' } }),
    );

    expect(results).toEqual([
      expect.objectContaining({
        name: 'answer',
        status: ColumnExtractionStatus.Extracted,
        result: 'Hi there, friend!',
      }),
    ]);
  });

  // The only failure signal is an explicit null, so a legitimately falsy value must stay Extracted.
  test.each([
    ['false', false, 'false'],
    ['zero', 0, '0'],
    ['an empty string', '', ''],
  ])('%s is extracted, not a failure', (_label, value, expected) => {
    const [result] = resolveInvocationColumns([column()], invocation({ extractedColumns: { answer: value } }));

    expect(result.status).toBe(ColumnExtractionStatus.Extracted);
    expect(result.result).toBe(expected);
  });

  test('an explicit null is a failure carrying the warning error', () => {
    const results = resolveInvocationColumns(
      [column({ name: 'summary' })],
      invocation({
        extractedColumns: { summary: null },
        extractionWarnings: [{ column: 'summary', expression: '$.missing.path', error: 'Expression matched nothing' }],
      }),
    );

    expect(results).toEqual([
      expect.objectContaining({
        name: 'summary',
        status: ColumnExtractionStatus.Failed,
        result: '',
        error: 'Expression matched nothing',
      }),
    ]);
  });

  test('the expression displayed is the one the backend evaluated', () => {
    const [result] = resolveInvocationColumns(
      [column({ name: 'summary', expression: 'locally.edited.path' })],
      invocation({
        extractedColumns: { summary: null },
        extractionWarnings: [{ column: 'summary', expression: 'saved.path', error: 'boom' }],
      }),
    );

    expect(result.expression).toBe('saved.path');
  });

  test('a failure with no matching warning invents no reason', () => {
    const [result] = resolveInvocationColumns(
      [column({ name: 'summary' })],
      invocation({
        extractedColumns: { summary: null },
        extractionWarnings: [{ column: 'other', expression: 'x', error: 'not this one' }],
      }),
    );

    expect(result.status).toBe(ColumnExtractionStatus.Failed);
    expect(result.error).toBeUndefined();
  });

  test('success and failure coexist in one invocation', () => {
    const results = resolveInvocationColumns(
      [column(), column({ name: 'summary' })],
      invocation({
        extractedColumns: { answer: 'Hi!', summary: null },
        extractionWarnings: [{ column: 'summary', expression: 'x', error: 'Expression matched nothing' }],
      }),
    );

    expect(results.map(({ name, status }) => [name, status])).toEqual([
      ['answer', ColumnExtractionStatus.Extracted],
      ['summary', ColumnExtractionStatus.Failed],
    ]);
  });

  test('a declared column absent from the mapping is not extracted', () => {
    const results = resolveInvocationColumns(
      [column(), column({ name: 'id', expression: 'id' })],
      invocation({ extractedColumns: { answer: 'Hi!' } }),
    );

    expect(results[1]).toEqual(
      expect.objectContaining({
        name: 'id',
        status: ColumnExtractionStatus.NotExtracted,
        reason: NotExtractedReason.NoExtractionReported,
      }),
    );
  });

  test('keeps the declared name and type for every column', () => {
    const results = resolveInvocationColumns(
      [column({ name: 'score', type: 'NUMBER' })],
      invocation({ extractedColumns: { score: 0.5 } }),
    );

    expect(results[0]).toEqual(expect.objectContaining({ name: 'score', type: 'NUMBER' }));
  });

  describe('no extraction reported', () => {
    test('a non-success status reports the request failed', () => {
      const results = resolveInvocationColumns([column()], { response: { statusCode: 401 } });

      expect(results).toEqual([
        expect.objectContaining({
          status: ColumnExtractionStatus.NotExtracted,
          reason: NotExtractedReason.RequestFailed,
          statusCode: 401,
          result: '',
        }),
      ]);
    });

    test.each([StreamingStatus.Timeout, StreamingStatus.Error, StreamingStatus.Failed])(
      'a %s stream reports the stream did not complete',
      (streamingStatus) => {
        const results = resolveInvocationColumns([column()], {
          response: { statusCode: 200, streaming: true, streamingStatus },
        });

        expect(results[0].reason).toBe(NotExtractedReason.StreamIncomplete);
      },
    );

    test('a successful stream is not treated as incomplete', () => {
      const results = resolveInvocationColumns([column()], {
        response: { statusCode: 200, streaming: true, streamingStatus: StreamingStatus.Success },
      });

      expect(results[0].reason).toBe(NotExtractedReason.NoExtractionReported);
    });

    // A result stored before the backend reported extraction restores as an envelope without it.
    test('a successful invocation with columns but no extraction reports the neutral reason', () => {
      const results = resolveInvocationColumns([column()], { response: { statusCode: 200 } });

      expect(results[0]).toEqual(
        expect.objectContaining({
          status: ColumnExtractionStatus.NotExtracted,
          reason: NotExtractedReason.NoExtractionReported,
        }),
      );
      expect(results[0].statusCode).toBeUndefined();
    });

    test('an invocation with no response at all reports the neutral reason', () => {
      const results = resolveInvocationColumns([column()], {});

      expect(results[0].reason).toBe(NotExtractedReason.NoExtractionReported);
    });

    test('a suite declaring no columns yields no results', () => {
      expect(resolveInvocationColumns([], { response: { statusCode: 401 } })).toEqual([]);
      expect(resolveInvocationColumns([], invocation({ extractedColumns: {} }))).toEqual([]);
    });
  });

  /**
   * The reproduced bug: a streaming Responses API try-out. `response.body` is an SSE envelope with no
   * `id` and no `output`, so evaluating the columns in the browser resolved nothing and both rendered
   * as Invalid — while the backend had extracted both.
   */
  test('a streaming Responses API response shows both reported columns', () => {
    const results = resolveInvocationColumns([column(), column({ name: 'id', expression: 'id' })], {
      response: {
        statusCode: 200,
        streaming: true,
        body: {
          events: [
            { event: 'response.created', data: { response: { id: 'dial_gpt-5.6-sol', output: [] } } },
            { event: 'response.output_text.delta', data: { delta: 'Hi ' } },
            { event: 'response.completed', data: { response: { id: 'dial_gpt-5.6-sol' } } },
          ],
        },
      },
      extractedColumns: { answer: 'Hi there, friend!', id: 'dial_gpt-5.6-sol' },
      extractionWarnings: [],
    });

    expect(results).toEqual([
      expect.objectContaining({
        name: 'answer',
        status: ColumnExtractionStatus.Extracted,
        result: 'Hi there, friend!',
      }),
      expect.objectContaining({
        name: 'id',
        status: ColumnExtractionStatus.Extracted,
        result: 'dial_gpt-5.6-sol',
      }),
    ]);
  });

  test('a full try-out envelope satisfies the invocation shape', () => {
    const envelope: TryOutResponse = {
      resolvedRequest: { url: '/openai/v1/responses', body: {} },
      response: { statusCode: 200, streaming: true, events: [] },
      grafanaTraceUrl: 'http://grafana:3000/explore?x',
      history: [],
      extractedColumns: { answer: 'Hi there, friend!', id: 'dial_gpt' },
      extractionWarnings: [],
    };

    const results = resolveInvocationColumns([column(), column({ name: 'id', expression: 'id' })], {
      response: envelope.response,
      extractedColumns: envelope.extractedColumns,
      extractionWarnings: envelope.extractionWarnings,
    });

    expect(results.map(({ result }) => result)).toEqual(['Hi there, friend!', 'dial_gpt']);
  });
});
