import { describe, expect, test } from 'vitest';

import { RAW_BODY_BYTE_BUDGET } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationEntryBodyRow,
  HopDialect,
  HopReadState,
  HopSideGrants,
} from '@/src/models/analytics/conversations-trace';
import { embeddingFactsOf } from '@/src/utils/analytics/hop-inspector/embedding';
import { mcpFactsOf } from '@/src/utils/analytics/hop-inspector/mcp';
import { rawBodyOf, responseEnvelopeOf } from '@/src/utils/analytics/hop-inspector/response';

const row = (overrides: Partial<ConversationEntryBodyRow> = {}): ConversationEntryBodyRow => ({
  trace_id: 't1',
  event_kind: 'llm_call',
  request_body: '{}',
  response_body: null,
  ...overrides,
});

describe('responseEnvelopeOf', () => {
  // Which decoder runs is the caller's decision, taken from the request URI, not something the response row
  // reveals about itself. Every body in this block records the chat-completions shape.
  const envelopeOf = (source: ConversationEntryBodyRow) => responseEnvelopeOf(source, HopDialect.ChatCompletions);

  const assembled = JSON.stringify({
    choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'answered' } }],
  });

  test('reads the assembled column and its finish reason', () => {
    const envelope = envelopeOf(row({ assembled_response: assembled }));

    expect(envelope.text).toBe('answered');
    expect(envelope.finishReason).toBe('stop');
  });

  // The column is a later addition to the hop log, and an instance predating it does not persist it — so its
  // absence is handled rather than assumed away.
  test('decodes the recorded body when the assembled column is absent', () => {
    const envelope = envelopeOf(row({ response_body: assembled }));

    expect(envelope.text).toBe('answered');
  });

  test('a hop that recorded nothing is stated as empty, not as a failure', () => {
    expect(envelopeOf(row()).state).toBe(HopReadState.NoBody);
  });

  test('a body no parser can read is unstructured, not absent', () => {
    const envelope = envelopeOf(row({ response_body: '{"error":{"message":"unprocessable"}}' }));

    expect(envelope.state).toBe(HopReadState.Unstructured);
    expect(envelope.recordedBytes).toBe('{"error":{"message":"unprocessable"}}'.length);
  });

  test('states the tools a response requested, with their arguments and ids', () => {
    const withTools = JSON.stringify({
      choices: [
        {
          message: {
            role: 'assistant',
            tool_calls: [{ id: 'call_1', function: { name: 'calc', arguments: '{"a":1}' } }],
          },
        },
      ],
    });

    expect(envelopeOf(row({ response_body: withTools })).toolCalls).toEqual([
      { name: 'calc', args: '{"a":1}', id: 'call_1' },
    ]);
  });

  // The dialect is what the parameter is for. Both shapes land in the same `assembled_response` column, so
  // handing this body to the chat-completions decoder finds no `choices` and reports "recorded nothing" while
  // a full response sits in the column — and the reasoning summary is kept apart from the answer rather than
  // read as part of it.
  test('decodes the Responses shape when told that is the dialect', () => {
    const body = row({
      assembled_response: JSON.stringify({
        status: 'completed',
        output: [
          { type: 'reasoning', summary: [{ type: 'summary_text', text: 'thought about it' }] },
          { type: 'message', content: [{ type: 'output_text', text: 'answered' }] },
        ],
      }),
    });

    const envelope = responseEnvelopeOf(body, HopDialect.Responses);

    expect(envelope.text).toBe('answered');
    expect(envelope.reasoningText).toBe('thought about it');
    expect(envelope.finishReason).toBe('completed');
    expect(envelopeOf(body).state).toBe(HopReadState.NoBody);
  });

  // None of these is on the hop row: it carries the *deployment*, which is not the model string the upstream
  // reports, and the token total without its split.
  describe('the facts a response states about itself', () => {
    test('states the upstream model, the completion id and the token split', () => {
      const facts = envelopeOf(
        row({
          assembled_response: JSON.stringify({
            model: 'gpt-4o-2024-11-20',
            id: 'chatcmpl-123',
            usage: { prompt_tokens: 900, completion_tokens: 42 },
            choices: [{ message: { role: 'assistant', content: 'answered' } }],
          }),
        }),
      ).facts;

      expect(facts).toEqual({
        model: 'gpt-4o-2024-11-20',
        completionId: 'chatcmpl-123',
        promptTokens: 900,
        completionTokens: 42,
        cachedTokens: null,
      });
    });

    // Both dialects report the same facts in the same place and disagree only on the usage spelling, so
    // reading one spelling would drop the split for whichever dialect this was not written against.
    test('reads the input/output spelling of the same usage keys', () => {
      const facts = envelopeOf(
        row({
          assembled_response: JSON.stringify({
            model: 'claude',
            usage: { input_tokens: 700, output_tokens: 11, input_tokens_details: { cached_tokens: 512 } },
            choices: [{ message: { role: 'assistant', content: 'answered' } }],
          }),
        }),
      ).facts;

      expect(facts).toMatchObject({ promptTokens: 700, completionTokens: 11, cachedTokens: 512 });
    });

    // The one figure that explains a bill the total does not, and a reported zero is an answer — "no cache
    // hit" — so it is kept rather than folded into "nothing reported".
    test('keeps a reported zero cache hit', () => {
      const facts = envelopeOf(
        row({
          assembled_response: JSON.stringify({
            model: 'gpt',
            usage: { prompt_tokens: 10, prompt_tokens_details: { cached_tokens: 0 } },
            choices: [{ message: { role: 'assistant', content: 'answered' } }],
          }),
        }),
      ).facts;

      expect(facts.cachedTokens).toBe(0);
    });

    // A zero here would read as a call that used no tokens, which is a different claim from a provider that
    // reported nothing.
    test('states no facts rather than zeros for a body that reported no usage', () => {
      expect(envelopeOf(row({ assembled_response: assembled })).facts).toEqual({
        model: null,
        completionId: null,
        promptTokens: null,
        completionTokens: null,
        cachedTokens: null,
      });
    });

    // A stream carries its usage in a late frame rather than the first, so the frame that reports one is the
    // frame the facts come from.
    test('recovers the usage a stream reports in a late frame', () => {
      const stream = [
        'data: {"model":"gpt","id":"chatcmpl-9","choices":[{"delta":{"content":"an"}}]}',
        'data: {"choices":[],"usage":{"prompt_tokens":120,"completion_tokens":7}}',
        'data: [DONE]',
      ].join('\n');

      const facts = envelopeOf(row({ response_body: stream })).facts;

      expect(facts).toMatchObject({ promptTokens: 120, completionTokens: 7 });
    });
  });
});

describe('rawBodyOf', () => {
  test('states the recorded and delivered sizes when it clamps', () => {
    const body = rawBodyOf('x'.repeat(RAW_BODY_BYTE_BUDGET + 100));

    expect(body.clamp).toEqual({
      isClamped: true,
      recordedBytes: RAW_BODY_BYTE_BUDGET + 100,
      deliveredBytes: RAW_BODY_BYTE_BUDGET,
    });
  });

  test('leaves a body inside the budget whole', () => {
    expect(rawBodyOf('small')).toMatchObject({ text: 'small', clamp: { isClamped: false } });
  });

  test('an absent body is empty rather than a failure', () => {
    expect(rawBodyOf(null).state).toBe(HopReadState.NoBody);
  });
});

const BOTH_SIDES: HopSideGrants = { isRequestReadable: true, isResponseReadable: true };

describe('mcpFactsOf', () => {
  const request = JSON.stringify({ params: { arguments: { page: 'home' } } });
  const response = 'data: {"result":{"content":[{"type":"text","text":"the page"}]}}\n';

  test('states the arguments, the result and the toolset', () => {
    const facts = mcpFactsOf({
      row: row({ event_kind: 'mcp', request_body: request, response_body: response }),
      method: 'tools/call',
      toolName: 'get_page',
      toolset: 'docs-mcp',
      grants: BOTH_SIDES,
    });

    expect(facts.argumentsText).toContain('"page": "home"');
    expect(facts.resultText).toBe('the page');
    expect(facts.toolset).toBe('docs-mcp');
  });

  // A `tools/call` result is routinely a JSON document returned on one line.
  test('formats a JSON result, and still states the size the log recorded', () => {
    const recorded = '{"stdout":"one","exit_code":0}';
    const facts = mcpFactsOf({
      row: row({
        event_kind: 'mcp',
        request_body: request,
        response_body: `data: ${JSON.stringify({ result: { content: [{ type: 'text', text: recorded }] } })}\n`,
      }),
      method: 'tools/call',
      toolName: 'run_code',
      toolset: 'code-mcp',
      grants: BOTH_SIDES,
    });

    expect(facts.resultText).toBe('{\n  "stdout": "one",\n  "exit_code": 0\n}');
    // The formatted text is longer than what was recorded, and the reader is told the recorded size.
    expect(facts.resultClamp.recordedBytes).toBe(recorded.length);
    expect((facts.resultText as string).length).toBeGreaterThan(recorded.length);
  });

  test('leaves a result that is not JSON exactly as it was recorded', () => {
    const facts = mcpFactsOf({
      row: row({ event_kind: 'mcp', request_body: request, response_body: response }),
      method: 'tools/call',
      toolName: 'get_page',
      toolset: 'docs-mcp',
      grants: BOTH_SIDES,
    });

    expect(facts.resultText).toBe('the page');
    expect(facts.resultClamp.recordedBytes).toBe('the page'.length);
  });

  test('a hop that recorded neither is stated as empty', () => {
    const facts = mcpFactsOf({
      row: row({ request_body: null }),
      method: null,
      toolName: null,
      toolset: null,
      grants: BOTH_SIDES,
    });

    expect(facts.state).toBe(HopReadState.NoBody);
    expect(facts.resultState).toBe(HopReadState.NoBody);
  });

  // The two sides can be entitled separately, and "you may not read this" is not "the hop recorded nothing".
  // Reporting the second for the first describes the caller's entitlement as a property of the hop.
  test('a withheld response column is stated as withheld rather than as an empty result', () => {
    const facts = mcpFactsOf({
      row: row({ event_kind: 'mcp', request_body: request, response_body: response }),
      method: 'tools/call',
      toolName: 'get_page',
      toolset: 'docs-mcp',
      grants: { isRequestReadable: true, isResponseReadable: false },
    });

    expect(facts.argumentsText).toContain('"page": "home"');
    expect(facts.resultText).toBeNull();
    expect(facts.resultState).toBe(HopReadState.ColumnWithheld);
    // The arguments are readable, so the panel itself is available — only its result half is withheld.
    expect(facts.state).toBe(HopReadState.Available);
  });
});

describe('embeddingFactsOf', () => {
  test('states the model, the input count and the probe text', () => {
    const facts = embeddingFactsOf(
      row({ request_body: JSON.stringify({ model: 'ada', input: ['a', 'b'] }) }),
      BOTH_SIDES,
    );

    expect(facts).toMatchObject({ model: 'ada', inputCount: 2, inputText: 'a\nb' });
  });

  test('counts dimensions from a plain float vector', () => {
    const body = row({
      request_body: JSON.stringify({ input: 'probe' }),
      response_body: JSON.stringify({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
    });

    expect(embeddingFactsOf(body, BOTH_SIDES).dimensions).toBe(3);
  });

  // 96% of recorded vectors arrive base64-encoded, so the count is derived from the encoded length.
  test('counts dimensions from a base64 vector', () => {
    const body = row({
      request_body: JSON.stringify({ input: 'probe' }),
      response_body: JSON.stringify({ data: [{ embedding: 'A'.repeat(16) }] }),
    });

    expect(embeddingFactsOf(body, BOTH_SIDES).dimensions).toBe(3);
  });

  test('a request with no input is stated as empty', () => {
    expect(embeddingFactsOf(row({ request_body: '{}' }), BOTH_SIDES).state).toBe(HopReadState.NoBody);
  });

  // A single input averages 352 B, but the endpoint takes an array — and a batch is one string here, which is
  // the one path in the folder that walked past the payload budget.
  test('clamps a batch of inputs to the budget and states that it clamped', () => {
    const input = ['x'.repeat(RAW_BODY_BYTE_BUDGET), 'y'.repeat(RAW_BODY_BYTE_BUDGET)];
    const facts = embeddingFactsOf(row({ request_body: JSON.stringify({ input }) }), BOTH_SIDES);

    expect(facts.inputText?.length).toBe(RAW_BODY_BYTE_BUDGET);
    expect(facts.inputClamp.isClamped).toBe(true);
    expect(facts.inputClamp.recordedBytes).toBeGreaterThan(RAW_BODY_BYTE_BUDGET);
  });

  test('a withheld request column withholds the panel rather than reporting an empty probe', () => {
    const facts = embeddingFactsOf(row({ request_body: JSON.stringify({ input: 'probe' }) }), {
      isRequestReadable: false,
      isResponseReadable: true,
    });

    expect(facts.state).toBe(HopReadState.ColumnWithheld);
    expect(facts.inputText).toBeNull();
  });

  // Only the dimension count comes from the response column, so only it is withheld.
  test('a withheld response column states the dimension count as withheld', () => {
    const facts = embeddingFactsOf(
      row({
        request_body: JSON.stringify({ input: 'probe' }),
        response_body: JSON.stringify({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
      }),
      { isRequestReadable: true, isResponseReadable: false },
    );

    expect(facts.state).toBe(HopReadState.Available);
    expect(facts.dimensions).toBeNull();
    expect(facts.isDimensionsWithheld).toBe(true);
  });
});
