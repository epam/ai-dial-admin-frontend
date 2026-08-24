import { describe, expect, test } from 'vitest';

import { USAGE_LOG_RETENTION_MS } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationEntryBodyRow,
  ConversationEntryHopRow,
  MessageRole,
  TranscriptState,
} from '@/src/models/analytics/conversations-trace';
import {
  assembleTranscript,
  carriesWholeConversation,
  questionsByTurn,
  transcriptStateOf,
} from '@/src/utils/analytics/conversation-transcript';

const NOW = Date.UTC(2026, 7, 20);

const hop = (traceId: string, messageCount: number | null, timeMs = 0): ConversationEntryHopRow => ({
  trace_id: traceId,
  request_time: timeMs,
  deployment: 'app',
  number_request_messages: messageCount,
  request_body_bytes: 100,
  response_body_bytes: 200,
});

const answer = (text: string): string =>
  JSON.stringify({ choices: [{ index: 0, message: { role: 'assistant', content: text } }] });

const body = (
  traceId: string,
  messages: { role: string; content?: string }[],
  reply: string,
): ConversationEntryBodyRow => ({
  trace_id: traceId,
  event_kind: 'llm_call',
  request_body: JSON.stringify({ messages, stream: true }),
  response_body: null,
  assembled_response: answer(reply),
});

const user = (content: string) => ({ role: 'user', content });
const assistant = (content: string) => ({ role: 'assistant', content });

const rendered = (traceId: string, role: MessageRole, content: string | null) => ({ role, content, trace_id: traceId });

describe('carriesWholeConversation', () => {
  // A full-history client: measured `1, 3, 5, 7, 9, 11` across six turns — exactly 2k-1 at every turn.
  test('holds for a full-history client whose every hop carries 2k-1 messages', () => {
    const hops = [1, 3, 5, 7, 9, 11].map((count, index) => hop(`t${index}`, count, index));

    expect(carriesWholeConversation(hops)).toBe(true);
  });

  // The shortcut fetches one body and attributes its messages by index, so the sequence has to hold at every
  // turn and not merely end high enough. A newest hop carrying more than 2n-1 says the content is all there
  // but says nothing about where one turn ends and the next begins.
  test('does not hold when only the newest hop reaches 2n-1', () => {
    const hops = [1, 3, 5, 9].map((count, index) => hop(`t${index}`, count, index));

    expect(carriesWholeConversation(hops)).toBe(false);
  });

  // A full-history client that also resends a system message, or emits two messages per answer: the content
  // is all in the newest row, the boundaries are not one-per-two.
  test('does not hold when every turn carries an extra message', () => {
    const hops = [2, 4, 6].map((count, index) => hop(`t${index}`, count, index));

    expect(carriesWholeConversation(hops)).toBe(false);
  });

  test('does not hold when an earlier hop records no message count', () => {
    expect(carriesWholeConversation([hop('a', null, 0), hop('b', 3, 1)])).toBe(false);
  });

  // A DIAL application keeps conversation state server-side: measured `1, 3, 1, 1, 1, 1, 1, 1, 3, 5, 5`.
  test('does not hold for a deployment that sends only the new message', () => {
    const counts = [1, 3, 1, 1, 1, 1, 1, 1, 3, 5, 5];
    const hops = counts.map((count, index) => hop(`t${index}`, count, index));

    expect(carriesWholeConversation(hops)).toBe(false);
  });

  test('does not hold when the newest hop records no message count', () => {
    expect(carriesWholeConversation([hop('a', 1, 0), hop('b', null, 1)])).toBe(false);
  });

  test('does not hold for no entry hops at all', () => {
    expect(carriesWholeConversation([])).toBe(false);
  });

  test('holds for a single turn carrying one message', () => {
    expect(carriesWholeConversation([hop('a', 1, 0)])).toBe(true);
  });
});

describe('assembleTranscript', () => {
  test('assembles a server-side-state deployment across turns, not from one row', () => {
    const hops = [hop('t1', 1, 1), hop('t2', 1, 2), hop('t3', 1, 3)];
    const bodies = [
      body('t1', [user('first')], 'reply one'),
      body('t2', [user('second')], 'reply two'),
      body('t3', [user('third')], 'reply three'),
    ];

    expect(assembleTranscript(hops, bodies)).toEqual([
      rendered('t1', MessageRole.User, 'first'),
      rendered('t1', MessageRole.Assistant, 'reply one'),
      rendered('t2', MessageRole.User, 'second'),
      rendered('t2', MessageRole.Assistant, 'reply two'),
      rendered('t3', MessageRole.User, 'third'),
      rendered('t3', MessageRole.Assistant, 'reply three'),
    ]);
  });

  test('renders a full-history client’s resent messages exactly once', () => {
    const hops = [hop('t1', 1, 1), hop('t2', 3, 2)];
    const bodies = [
      body('t1', [user('first')], 'reply one'),
      body('t2', [user('first'), assistant('reply one'), user('second')], 'reply two'),
    ];

    expect(assembleTranscript(hops, bodies)).toEqual([
      rendered('t1', MessageRole.User, 'first'),
      rendered('t1', MessageRole.Assistant, 'reply one'),
      rendered('t2', MessageRole.User, 'second'),
      rendered('t2', MessageRole.Assistant, 'reply two'),
    ]);
  });

  // A turn that answered with tool calls alone decodes to no text, and the resent copy of that same message
  // carries no `content` key at all. Comparing the two strictly found no overlap and re-appended the whole
  // history under the later turn — the reader saw their first question twice, the duplicate answer carrying
  // the later turn's tokens, cost and duration.
  test('recognises a resent message whose text was never recorded', () => {
    const hops = [hop('t1', 1, 1), hop('t2', 3, 2)];
    const bodies: ConversationEntryBodyRow[] = [
      {
        trace_id: 't1',
        event_kind: 'llm_call',
        request_body: JSON.stringify({ messages: [user('first')] }),
        response_body: null,
        assembled_response: JSON.stringify({ choices: [{ index: 0, message: { role: 'assistant' } }] }),
      },
      body('t2', [user('first'), { role: 'assistant' }, user('second')], 'two'),
    ];

    expect(assembleTranscript(hops, bodies)).toEqual([
      rendered('t1', MessageRole.User, 'first'),
      rendered('t1', MessageRole.Assistant, null),
      rendered('t2', MessageRole.User, 'second'),
      rendered('t2', MessageRole.Assistant, 'two'),
    ]);
  });

  // The shape neither branch of a client-shape classifier would get right, which is why one overlap rule
  // covers both instead.
  test('assembles a conversation that mixes both shapes', () => {
    const hops = [hop('t1', 1, 1), hop('t2', 3, 2), hop('t3', 1, 3)];
    const bodies = [
      body('t1', [user('a')], 'A'),
      body('t2', [user('a'), assistant('A'), user('b')], 'B'),
      body('t3', [user('c')], 'C'),
    ];

    expect(assembleTranscript(hops, bodies).map(({ content }) => content)).toEqual(['a', 'A', 'b', 'B', 'c', 'C']);
  });

  // The shortcut changes which rows are fetched, never what is assembled — including which turn each message
  // belongs to. Comparing only the content is what let a shortcut that put the newest turn's figures under
  // every answer in the conversation pass its tests.
  test('the 2n-1 shortcut and the full read produce the same transcript', () => {
    const hops = [hop('t1', 1, 1), hop('t2', 3, 2), hop('t3', 5, 3)];
    const full = [
      body('t1', [user('a')], 'A'),
      body('t2', [user('a'), assistant('A'), user('b')], 'B'),
      body('t3', [user('a'), assistant('A'), user('b'), assistant('B'), user('c')], 'C'),
    ];

    expect(carriesWholeConversation(hops)).toBe(true);
    // Under the shortcut only the newest row's bodies are fetched.
    const shortcut = assembleTranscript(hops, [full[2]]);

    expect(shortcut).toEqual(assembleTranscript(hops, full));
  });

  // The bug this pins: one body carries the whole history, so every message would otherwise be tagged with
  // the hop the body was found under, and every answer in the conversation would show the newest turn's
  // tokens, cost, hops and duration.
  test('the shortcut attributes each message to its own turn, not to the newest', () => {
    const hops = [hop('t1', 1, 1), hop('t2', 3, 2), hop('t3', 5, 3)];
    const whole = body('t3', [user('a'), assistant('A'), user('b'), assistant('B'), user('c')], 'C');

    expect(assembleTranscript(hops, [whole]).map(({ trace_id }) => trace_id)).toEqual([
      't1',
      't1',
      't2',
      't2',
      't3',
      't3',
    ]);
  });

  // Shifting every message onto the wrong turn is silent; paying for every row is not. A body whose roles the
  // decoder declined to carry is how the history comes back shorter than the counts promised.
  test('a history that is not the promised length falls back to the per-turn read', () => {
    const hops = [hop('t1', 1, 1), hop('t2', 3, 2)];
    const short = body('t2', [user('b')], 'B');

    // Only t2's body was fetched, so the per-turn path contributes t2's messages and nothing is misattributed.
    expect(assembleTranscript(hops, [short])).toEqual([
      rendered('t2', MessageRole.User, 'b'),
      rendered('t2', MessageRole.Assistant, 'B'),
    ]);
  });

  test('tags every message with its own turn, so figures are matched by trace id', () => {
    const hops = [hop('alpha', 1, 1), hop('beta', 1, 2)];
    const bodies = [body('alpha', [user('q1')], 'a1'), body('beta', [user('q2')], 'a2')];

    expect(assembleTranscript(hops, bodies).map(({ trace_id }) => trace_id)).toEqual([
      'alpha',
      'alpha',
      'beta',
      'beta',
    ]);
  });

  test('renders null content for a turn whose response yielded no text', () => {
    const undecodable: ConversationEntryBodyRow = {
      trace_id: 't1',
      event_kind: 'llm_call',
      request_body: JSON.stringify({ messages: [user('q')] }),
      response_body: 'not decodable',
      assembled_response: null,
    };

    expect(assembleTranscript([hop('t1', 1, 1)], [undecodable])).toEqual([
      rendered('t1', MessageRole.User, 'q'),
      rendered('t1', MessageRole.Assistant, null),
    ]);
  });

  test('skips an entry hop whose body was not fetched', () => {
    const hops = [hop('t1', 1, 1), hop('t2', 1, 2)];

    expect(assembleTranscript(hops, [body('t2', [user('only')], 'reply')])).toEqual([
      rendered('t2', MessageRole.User, 'only'),
      rendered('t2', MessageRole.Assistant, 'reply'),
    ]);
  });

  test('assembles nothing from no entry hops', () => {
    expect(assembleTranscript([], [])).toEqual([]);
  });

  // A repeated question is a real thing a user does, and the overlap rule must not swallow it: the run only
  // matches where it aligns with the tail of what is already assembled.
  test('keeps a genuinely repeated question', () => {
    const hops = [hop('t1', 1, 1), hop('t2', 1, 2)];
    const bodies = [body('t1', [user('again?')], 'yes'), body('t2', [user('again?')], 'still yes')];

    expect(assembleTranscript(hops, bodies).map(({ content }) => content)).toEqual([
      'again?',
      'yes',
      'again?',
      'still yes',
    ]);
  });
});

describe('transcriptStateOf', () => {
  const base = {
    isReadable: true,
    hasLoadFailed: false,
    entryHopCount: 0,
    hopCount: 0,
    lastRequestTime: NOW,
    nowMs: NOW,
  };

  test('reports available when entry hops were read', () => {
    expect(transcriptStateOf({ ...base, entryHopCount: 6, hopCount: 20 })).toBe(TranscriptState.Available);
  });

  // A failure is not an absence, and takes precedence over every other test.
  test('reports a failure ahead of anything else', () => {
    expect(transcriptStateOf({ ...base, hasLoadFailed: true, isReadable: false, hopCount: 5 })).toBe(
      TranscriptState.LoadFailed,
    );
  });

  test('reports the columns unavailable for a caller whose schema omits them', () => {
    expect(transcriptStateOf({ ...base, isReadable: false, entryHopCount: 0, hopCount: 12 })).toBe(
      TranscriptState.ColumnsUnavailable,
    );
  });

  // Hops exist but none entered DIAL: the detail cannot be attributed to the user, which is not the same as
  // never having been recorded.
  test('reports not reconstructable when the conversation has hops but no entry hop', () => {
    expect(transcriptStateOf({ ...base, entryHopCount: 0, hopCount: 10 })).toBe(TranscriptState.NotReconstructable);
  });

  test('reports expired when nothing was recorded and the conversation outlived the retention', () => {
    const lastRequestTime = NOW - USAGE_LOG_RETENTION_MS - 1;

    expect(transcriptStateOf({ ...base, lastRequestTime })).toBe(TranscriptState.Expired);
  });

  test('reports no messages when nothing was recorded within the retention window', () => {
    const lastRequestTime = NOW - USAGE_LOG_RETENTION_MS + 1000;

    expect(transcriptStateOf({ ...base, lastRequestTime })).toBe(TranscriptState.NoMessages);
  });

  test('reports no messages rather than expired when the conversation records no last request time', () => {
    expect(transcriptStateOf({ ...base, lastRequestTime: null })).toBe(TranscriptState.NoMessages);
  });

  test('distinguishes all six outcomes', () => {
    const states = [
      transcriptStateOf({ ...base, entryHopCount: 1 }),
      transcriptStateOf({ ...base, isReadable: false }),
      transcriptStateOf({ ...base, hopCount: 3 }),
      transcriptStateOf({ ...base, lastRequestTime: NOW - USAGE_LOG_RETENTION_MS - 1 }),
      transcriptStateOf({ ...base }),
      transcriptStateOf({ ...base, hasLoadFailed: true }),
    ];

    expect(new Set(states).size).toBe(6);
  });
});

describe('questionsByTurn', () => {
  // A turn's request body always ends with the user's new message, so the last user message a turn
  // contributed is that turn's question. Read off the assembled transcript, so both fetch paths are covered
  // by one rule and nothing new is read for it.
  test('keys each turn own question by its trace id', () => {
    const messages = [
      rendered('t1', MessageRole.User, 'first question'),
      rendered('t1', MessageRole.Assistant, 'first answer'),
      rendered('t2', MessageRole.User, 'second question'),
      rendered('t2', MessageRole.Assistant, 'second answer'),
    ];

    expect(questionsByTurn(messages)).toEqual(
      new Map([
        ['t1', 'first question'],
        ['t2', 'second question'],
      ]),
    );
  });

  // A full-history client's turn contributes the previous turn's answer before its own question, so the last
  // user message is the one that belongs to it.
  test('takes the last user message a turn contributed, not the first', () => {
    const messages = [
      rendered('t2', MessageRole.User, 'echoed earlier question'),
      rendered('t2', MessageRole.User, 'the new question'),
    ];

    expect(questionsByTurn(messages).get('t2')).toBe('the new question');
  });

  test('never takes an assistant message as a question', () => {
    expect(questionsByTurn([rendered('t1', MessageRole.Assistant, 'an answer')]).has('t1')).toBe(false);
  });

  // The turn list has to work without a transcript: a conversation with no entry hop, or a caller whose
  // schema withheld the body columns, leaves the turn absent so the caller falls back to its number.
  test('omits a turn whose question is empty, absent or whitespace', () => {
    const questions = questionsByTurn([
      rendered('t1', MessageRole.User, ''),
      rendered('t2', MessageRole.User, '   '),
      rendered('t3', MessageRole.User, null),
    ]);

    expect(questions.size).toBe(0);
  });

  test('no messages yields no questions', () => {
    expect(questionsByTurn([])).toEqual(new Map());
  });
});
