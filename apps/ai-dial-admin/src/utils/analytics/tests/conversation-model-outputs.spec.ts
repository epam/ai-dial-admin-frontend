import { describe, expect, test } from 'vitest';

import {
  STREAM_MODEL_BODY_BYTE_BUDGET,
  STREAM_MODEL_BODY_LIMIT,
  TOOL_ARGUMENTS_PREVIEW_LIMIT,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationEntryBodyRow, ConversationSpanRow } from '@/src/models/analytics/conversations-trace';
import { modelOutputOf, splitModelBodyBudget, unreadOutputOf } from '@/src/utils/analytics/conversation-model-outputs';

const hop = (id: string, bytes: number | string | null): ConversationSpanRow =>
  ({ core_span_id: id, response_body_bytes: bytes }) as ConversationSpanRow;

const bodyRow = (over: Partial<ConversationEntryBodyRow> = {}): ConversationEntryBodyRow & { core_span_id: string } =>
  ({
    core_span_id: 's1',
    trace_id: 't1',
    event_kind: 'llm_call',
    request_body: null,
    response_body: null,
    assembled_response: null,
    ...over,
  }) as ConversationEntryBodyRow & { core_span_id: string };

describe('splitModelBodyBudget', () => {
  // A hop's response reaches 4.00 MiB, so a count alone bounds nothing useful.
  test('stops reading once the byte budget is spent', () => {
    const big = STREAM_MODEL_BODY_BYTE_BUDGET / 2;
    const { read, skipped } = splitModelBodyBudget([hop('a', big), hop('b', big), hop('c', big)]);

    expect(read.map(({ core_span_id }) => core_span_id)).toEqual(['a', 'b']);
    expect(skipped.map(({ core_span_id }) => core_span_id)).toEqual(['c']);
  });

  test('stops reading once the count is spent, whatever the sizes', () => {
    const hops = Array.from({ length: STREAM_MODEL_BODY_LIMIT + 3 }, (_unused, index) => hop(`s${index}`, 10));

    expect(splitModelBodyBudget(hops).read).toHaveLength(STREAM_MODEL_BODY_LIMIT);
    expect(splitModelBodyBudget(hops).skipped).toHaveLength(3);
  });

  // An unknown size is not a large one, and refusing it would silently drop a row that had text.
  test('reads a hop whose size was never recorded', () => {
    expect(splitModelBodyBudget([hop('a', null)]).read).toHaveLength(1);
  });

  test('the measured turn fits well inside the budget', () => {
    const measured = Array.from({ length: 43 }, (_unused, index) => hop(`s${index}`, 50_000));

    expect(splitModelBodyBudget(measured).skipped).toHaveLength(0);
  });

  test('nothing to read splits to nothing', () => {
    expect(splitModelBodyBudget([])).toEqual({ read: [], skipped: [] });
  });
});

describe('unreadOutputOf', () => {
  // "Not read" and "produced nothing" are different facts, and the stream types them differently.
  test('marks a call as unread rather than as empty', () => {
    expect(unreadOutputOf(hop('a', 10))).toEqual({
      core_span_id: 'a',
      text: null,
      toolCalls: [],
      isUnread: true,
    });
  });
});

describe('modelOutputOf', () => {
  test('decodes the text and the tool names a call produced', () => {
    const output = modelOutputOf(
      bodyRow({
        response_body: JSON.stringify({
          choices: [
            {
              message: {
                content: 'an answer',
                tool_calls: [{ function: { name: 'rag_search', arguments: '{"q":1}' } }],
              },
            },
          ],
        }),
      }),
    );

    expect(output).toEqual({
      core_span_id: 's1',
      text: 'an answer',
      toolCalls: [{ name: 'rag_search', argumentsPreview: '{"q":1}' }],
      isUnread: false,
    });
  });

  // Enough to tell two calls to the same tool apart; the whole set stays in the hop's body, one row-open away.
  test('cuts a long argument set to a preview', () => {
    const args = JSON.stringify({ q: 'x'.repeat(TOOL_ARGUMENTS_PREVIEW_LIMIT * 2) });
    const output = modelOutputOf(
      bodyRow({
        response_body: JSON.stringify({
          choices: [{ message: { content: '', tool_calls: [{ function: { name: 'get_page', arguments: args } }] } }],
        }),
      }),
    );
    const preview = output.toolCalls[0].argumentsPreview as string;

    expect(preview.length).toBe(TOOL_ARGUMENTS_PREVIEW_LIMIT + 1);
    expect(preview.endsWith('…')).toBe(true);
  });

  test('a call that produced nothing decodes to nothing, but is not marked unread', () => {
    const output = modelOutputOf(bodyRow());

    expect(output.text).toBeNull();
    expect(output.toolCalls).toEqual([]);
    expect(output.isUnread).toBe(false);
  });
});
