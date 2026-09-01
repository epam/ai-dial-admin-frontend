import { describe, expect, test } from 'vitest';

import { RAW_BODY_BYTE_BUDGET } from '@/src/constants/analytics/conversations-trace';
import { ConversationEntryBodyRow, HopReadState, HopSideGrants } from '@/src/models/analytics/conversations-trace';
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
  const assembled = JSON.stringify({
    choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'answered' } }],
  });

  test('reads the assembled column and its finish reason', () => {
    const envelope = responseEnvelopeOf(row({ assembled_response: assembled }));

    expect(envelope.text).toBe('answered');
    expect(envelope.finishReason).toBe('stop');
  });

  // The column is a later addition to the hop log, and an instance predating it does not persist it — so its
  // absence is handled rather than assumed away.
  test('decodes the recorded body when the assembled column is absent', () => {
    const envelope = responseEnvelopeOf(row({ response_body: assembled }));

    expect(envelope.text).toBe('answered');
  });

  test('a hop that recorded nothing is stated as empty, not as a failure', () => {
    expect(responseEnvelopeOf(row()).state).toBe(HopReadState.NoBody);
  });

  test('names the tools a response requested', () => {
    const withTools = JSON.stringify({
      choices: [{ message: { role: 'assistant', tool_calls: [{ function: { name: 'calc', arguments: '{}' } }] } }],
    });

    expect(responseEnvelopeOf(row({ response_body: withTools })).toolCalls).toEqual(['calc']);
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
