import { describe, expect, test } from 'vitest';

import {
  ENVELOPE_BYTE_BUDGET,
  MESSAGE_TEXT_CLAMP,
  RAW_BODY_BYTE_BUDGET,
} from '@/src/constants/analytics/conversations-trace';
import { HopDialect, HopToolCall, MessageRole } from '@/src/models/analytics/conversations-trace';
import {
  buildRequestEnvelope,
  clampBytes,
  clampText,
  jsonByteLength,
  roleOf,
  roleCountsOf,
  textByteLength,
} from '@/src/utils/analytics/hop-inspector/envelope';

const message = (role: MessageRole, text: string | null, bytes = 100, toolCalls: HopToolCall[] = []) => ({
  role,
  text,
  bytes,
  toolCalls,
});

const envelope = (messages: ReturnType<typeof message>[]) =>
  buildRequestEnvelope({
    dialect: HopDialect.ChatCompletions,
    params: { stated: [], unrecognisedCount: 0 },
    messages,
    recordedBytes: 1000,
  });

describe('roleOf', () => {
  test.each([
    ['system', MessageRole.System],
    ['user', MessageRole.User],
    ['assistant', MessageRole.Assistant],
    ['tool', MessageRole.Tool],
  ])('reads %s from the parsed structure', (raw, expected) => {
    expect(roleOf(raw)).toBe(expected);
  });

  // Dropping a message with an unfamiliar role would hide recorded work, which is the worse failure here.
  test('an unrecognised role is kept rather than dropped', () => {
    expect(roleOf('developer')).toBe(MessageRole.Other);
    expect(roleOf(undefined)).toBe(MessageRole.Other);
  });
});

describe('jsonByteLength', () => {
  // The reader is asking what made a request 166 KB, and the serialized form is what the log stored.
  test('measures the recorded JSON, not the rendered text', () => {
    expect(jsonByteLength({ a: 'x' })).toBe(9);
  });

  test('counts multi-byte characters as the bytes they occupy', () => {
    expect(jsonByteLength('é')).toBeGreaterThan(3);
  });
});

describe('clampText and clampBytes', () => {
  test('leaves short content alone', () => {
    expect(clampText('short')).toEqual({ text: 'short', isClamped: false });
  });

  test('clamps and says so', () => {
    const clamped = clampText('x'.repeat(MESSAGE_TEXT_CLAMP + 10));

    expect(clamped.isClamped).toBe(true);
    expect(clamped.text).toHaveLength(MESSAGE_TEXT_CLAMP);
  });

  // One byte of a multi-byte character can fall on the boundary, so a cut landing mid-character drops that
  // character rather than emitting a replacement for it.
  test('clamping by bytes never splits a character', () => {
    const { text } = clampBytes('é'.repeat(20), 5);

    expect(text).toBe('éé');
    expect(text).not.toContain('\uFFFD');
  });

  // The regression gate for the clamp being O(n) rather than O(n²). A 5-byte ASCII budget — what this file
  // tested before — has one byte per character, so the old character-trimming loop ran zero passes and the
  // defect was invisible. Multi-byte content at the real budget is what exercises it: the old form needed
  // ~242 000 re-encodes of a shrinking 800 KB string, which overruns the test timeout rather than returning.
  test('clamps a large multi-byte body in one pass', () => {
    const text = 'ф'.repeat(400_000);

    expect(textByteLength(text)).toBe(800_000);

    const clamped = clampBytes(text, RAW_BODY_BYTE_BUDGET);

    expect(clamped.isClamped).toBe(true);
    expect(textByteLength(clamped.text)).toBeLessThanOrEqual(RAW_BODY_BYTE_BUDGET);
    // Within one character of the budget: the only bytes given up are the ones that would have split a
    // character, not a scan's worth.
    expect(textByteLength(clamped.text)).toBeGreaterThan(RAW_BODY_BYTE_BUDGET - 2);
    expect(clamped.text).not.toContain('\uFFFD');
  });

  test('leaves a multi-byte body inside the budget whole', () => {
    const text = 'ф'.repeat(10);

    expect(clampBytes(text, RAW_BODY_BYTE_BUDGET)).toEqual({ text, isClamped: false });
  });
});

describe('buildRequestEnvelope', () => {
  test('numbers messages and counts their roles', () => {
    const built = envelope([message(MessageRole.System, 'a'), message(MessageRole.User, 'b')]);

    expect(built.messages.map(({ index }) => index)).toEqual([0, 1]);
    expect(built.roleCounts).toEqual([
      { role: MessageRole.System, count: 1 },
      { role: MessageRole.User, count: 1 },
    ]);
  });

  test('marks a message large enough to dominate the request', () => {
    const built = envelope([message(MessageRole.User, 'a', 4096), message(MessageRole.User, 'b', 10)]);

    expect(built.messages.map(({ isLarge }) => isLarge)).toEqual([true, false]);
  });

  // Once the total budget is spent, later messages keep the numbers a reader decides with and give up only
  // their text, which tier 2 can still fetch one at a time.
  test('drops text past the total budget while keeping every message stated', () => {
    const long = 'x'.repeat(MESSAGE_TEXT_CLAMP);
    const many = Array.from({ length: Math.ceil(ENVELOPE_BYTE_BUDGET / MESSAGE_TEXT_CLAMP) + 2 }, () =>
      message(MessageRole.User, long),
    );

    const built = envelope(many);

    expect(built.isClamped).toBe(true);
    expect(built.messages).toHaveLength(many.length);
    expect(built.messages.every(({ bytes, role }) => bytes > 0 && role === MessageRole.User)).toBe(true);
    expect(built.messages.at(-1)?.text).toBeNull();
  });

  test('a message that recorded no text is not reported as clamped', () => {
    const built = envelope([message(MessageRole.Assistant, null)]);

    expect(built.messages[0].isTextClamped).toBe(false);
  });
});

describe('roleCountsOf', () => {
  test('counts each role once', () => {
    expect(roleCountsOf([MessageRole.User, MessageRole.User, MessageRole.System])).toEqual([
      { role: MessageRole.User, count: 2 },
      { role: MessageRole.System, count: 1 },
    ]);
  });
});

// Tool-call arguments are content, so they take the clamp and count against the budget the text respects.
describe('buildRequestEnvelope :: tool calls', () => {
  test('carries a call whose message said nothing else', () => {
    const built = envelope([message(MessageRole.Assistant, '', 200, [{ name: 'calc', args: '{"a":1}' }])]);

    expect(built.messages[0].toolCalls).toEqual([{ name: 'calc', args: '{"a":1}' }]);
  });

  test('clamps long arguments and marks the message clamped', () => {
    const args = 'x'.repeat(MESSAGE_TEXT_CLAMP + 50);
    const built = envelope([message(MessageRole.Assistant, null, 200, [{ name: 'calc', args }])]);

    expect(built.messages[0].toolCalls[0].args).toHaveLength(MESSAGE_TEXT_CLAMP);
    expect(built.messages[0].isTextClamped).toBe(true);
  });

  // Past the budget a message keeps the names of what it called — a reader can still see that it called
  // something — and gives up only the arguments, which tier 2 fetches.
  test('keeps call names past the budget and drops only their arguments', () => {
    const long = 'x'.repeat(MESSAGE_TEXT_CLAMP);
    const many = Array.from({ length: Math.ceil(ENVELOPE_BYTE_BUDGET / MESSAGE_TEXT_CLAMP) + 2 }, () =>
      message(MessageRole.Assistant, long, 200, [{ name: 'calc', args: long }]),
    );

    const built = envelope(many);
    const last = built.messages.at(-1);

    expect(built.isClamped).toBe(true);
    expect(last?.toolCalls).toEqual([{ name: 'calc', args: null }]);
  });
});
