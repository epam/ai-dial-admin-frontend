import { describe, expect, test } from 'vitest';

import { ConversationEntryBodyRow, HopReadState, HopSideGrants } from '@/src/models/analytics/conversations-trace';
import { protocolFactsOf } from '@/src/utils/analytics/hop-inspector/protocol';

const BOTH_SIDES: HopSideGrants = { isRequestReadable: true, isResponseReadable: true };

// MCP answers over SSE, which is the framing every recorded protocol response in the log arrives in.
const frame = (result: unknown): string =>
  `event: message\r\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: 0, result })}\r\n\r\n`;

const row = (overrides: Partial<ConversationEntryBodyRow> = {}): ConversationEntryBodyRow => ({
  trace_id: 't1',
  event_kind: 'mcp',
  request_body: null,
  response_body: null,
  ...overrides,
});

describe('protocolFactsOf', () => {
  test('states the result the server answered with, formatted', () => {
    const facts = protocolFactsOf({
      row: row({
        request_body: JSON.stringify({ method: 'initialize', params: { protocolVersion: '2025-11-25' } }),
        response_body: frame({ serverInfo: { name: 'aws-code-interpreter', version: '3.4.7' } }),
      }),
      method: 'initialize',
      grants: BOTH_SIDES,
    });

    expect(facts.resultText).toBe(
      '{\n  "serverInfo": {\n    "name": "aws-code-interpreter",\n    "version": "3.4.7"\n  }\n}',
    );
    expect(facts.requestText).toContain('"protocolVersion": "2025-11-25"');
  });

  test('states a tools/list catalogue as the recorded result', () => {
    const facts = protocolFactsOf({
      row: row({ response_body: frame({ tools: [{ name: 'execute_python', inputSchema: { type: 'object' } }] }) }),
      method: 'tools/list',
      grants: BOTH_SIDES,
    });

    expect(facts.resultText).toContain('"name": "execute_python"');
    expect(facts.responseState).toBe(HopReadState.Available);
  });

  test('states the recorded size, not the size after formatting', () => {
    const facts = protocolFactsOf({
      row: row({ response_body: frame({ ok: true }) }),
      method: 'ping',
      grants: BOTH_SIDES,
    });

    expect(facts.resultText).toBe('{\n  "ok": true\n}');
    expect(facts.resultClamp.recordedBytes).toBe('{"ok":true}'.length);
  });

  test('a request carrying no parameters is stated as empty rather than as unread', () => {
    const facts = protocolFactsOf({
      row: row({ request_body: JSON.stringify({ method: 'tools/list', jsonrpc: '2.0', id: 1 }) }),
      method: 'tools/list',
      grants: BOTH_SIDES,
    });

    expect(facts.requestText).toBeNull();
    expect(facts.requestState).toBe(HopReadState.NoBody);
  });

  // A plain JSON body is as valid as an SSE frame, and one instance records it that way.
  test('reads a result that was not framed as SSE', () => {
    const facts = protocolFactsOf({
      row: row({ response_body: JSON.stringify({ jsonrpc: '2.0', id: 2, result: { tools: [] } }) }),
      method: 'tools/list',
      grants: BOTH_SIDES,
    });

    expect(facts.resultText).toBe('{\n  "tools": []\n}');
  });

  test('a withheld response column is stated as withheld rather than as an empty answer', () => {
    const facts = protocolFactsOf({
      row: row({ response_body: frame({ tools: [{ name: 'execute_python' }] }) }),
      method: 'tools/list',
      grants: { isRequestReadable: true, isResponseReadable: false },
    });

    expect(facts.responseState).toBe(HopReadState.ColumnWithheld);
    expect(facts.resultText).toBeNull();
  });
});
