import { describe, expect, test } from 'vitest';

import { mockConversationTranscript } from '@/src/mocks/analytics/conversation-transcript';
import { MessageRole } from '@/src/models/analytics/conversations-trace';

const CHAT_ID = 'Lrr0e6L5bpTND3IY_dN0_';

describe('mockConversationTranscript', () => {
  test('produces one user and one assistant message per turn', () => {
    const messages = mockConversationTranscript(CHAT_ID, 3);

    expect(messages).toHaveLength(6);
    expect(messages.map(({ role }) => role)).toEqual([
      MessageRole.User,
      MessageRole.Assistant,
      MessageRole.User,
      MessageRole.Assistant,
      MessageRole.User,
      MessageRole.Assistant,
    ]);
  });

  // An unstable transcript would read as changing data rather than a fixture.
  test('the same conversation always yields the same transcript', () => {
    expect(mockConversationTranscript(CHAT_ID, 4)).toEqual(mockConversationTranscript(CHAT_ID, 4));
  });

  test('different conversations start from different exchanges', () => {
    const a = mockConversationTranscript('conversation-a', 2);
    const b = mockConversationTranscript('conversation-bbbb', 2);

    expect(a[0].content).not.toBe(b[0].content);
  });

  test('every message carries content', () => {
    for (const { content } of mockConversationTranscript(CHAT_ID, 8)) {
      expect(content.length).toBeGreaterThan(0);
    }
  });

  test.each([0, -1])('a conversation with %s turns yields no messages', (turnCount) => {
    expect(mockConversationTranscript(CHAT_ID, turnCount)).toEqual([]);
  });

  test('a turn count beyond the exchange pool still yields a message per turn', () => {
    expect(mockConversationTranscript(CHAT_ID, 20)).toHaveLength(40);
  });

  // Padding the transcript would leave later assistant messages with no real figures beside them.
  test('never produces more exchanges than the conversation has turns', () => {
    for (const turnCount of [1, 2, 5]) {
      expect(mockConversationTranscript(CHAT_ID, turnCount)).toHaveLength(turnCount * 2);
    }
  });
});
