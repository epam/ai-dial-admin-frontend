import { describe, expect, test } from 'vitest';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationDetailRow,
  ConversationFeedbackRow,
  ConversationFieldFormat,
  ConversationFieldState,
  ConversationsField,
} from '@/src/models/analytics/conversations-trace';
import {
  countFeedbackDirections,
  isFeedbackPartial,
  resolveConversationField,
} from '@/src/utils/analytics/conversation-detail-fields';

const RECORD: ConversationDetailRow = {
  chat_id: 'Lrr0e6L5bpTND3IY_dN0_',
  project_id: '',
  user_hash: 'db7327ba3decd351',
  turn_count: 12,
  first_request_time: '2026-07-22T11:50:28.506Z',
  last_request_time: '2026-07-22T12:00:52.157Z',
  prompt_tokens: 4293420,
  completion_tokens: 70174,
  total_tokens: 4363594,
  total_price: '10.79380012',
  success_count: 0,
  duration_ms: 0,
  avg_duration_ms: 0,
};

const label = ConversationsTraceI18nKey.DetailTokensIn;

describe('resolveConversationField', () => {
  test('a definition with no column is unavailable and renders the marker', () => {
    expect(resolveConversationField({ labelKey: label }, RECORD)).toEqual({
      labelKey: label,
      state: ConversationFieldState.Unavailable,
      text: UNAVAILABLE_VALUE,
    });
  });

  test('a bound column with a value is available and formatted', () => {
    const resolved = resolveConversationField(
      { labelKey: label, column: ConversationsField.PromptTokens, format: ConversationFieldFormat.Count },
      RECORD,
    );

    expect(resolved.state).toBe(ConversationFieldState.Available);
    expect(resolved.text).toBe('4.3 M');
  });

  // The distinction the design exists to protect: `0` is a finding, and `value || marker` would erase it.
  test('a zero renders as a number, not as the unavailable marker', () => {
    const resolved = resolveConversationField(
      { labelKey: label, column: ConversationsField.SuccessCount, format: ConversationFieldFormat.Count },
      RECORD,
    );

    expect(resolved.state).toBe(ConversationFieldState.Available);
    expect(resolved.text).toBe('0');
    expect(resolved.text).not.toBe(UNAVAILABLE_VALUE);
  });

  test('an empty string is empty, not unavailable', () => {
    const resolved = resolveConversationField({ labelKey: label, column: ConversationsField.ProjectId }, RECORD);

    expect(resolved.state).toBe(ConversationFieldState.Empty);
    expect(resolved.text).toBe('');
  });

  test('a null value is empty, not unavailable', () => {
    const resolved = resolveConversationField(
      { labelKey: label, column: ConversationsField.UserHash },
      {
        ...RECORD,
        user_hash: null,
      },
    );

    expect(resolved.state).toBe(ConversationFieldState.Empty);
  });

  test('formats cost with the shared currency formatter', () => {
    const resolved = resolveConversationField(
      { labelKey: label, column: ConversationsField.TotalPrice, format: ConversationFieldFormat.Cost },
      RECORD,
    );

    expect(resolved.text).toBe('$10.8');
  });

  test('formats a timestamp rather than echoing the wire value', () => {
    const resolved = resolveConversationField(
      { labelKey: label, column: ConversationsField.FirstRequestTime, format: ConversationFieldFormat.DateTime },
      RECORD,
    );

    expect(resolved.state).toBe(ConversationFieldState.Available);
    expect(resolved.text).not.toBe(RECORD.first_request_time);
  });

  test('an unformattable value reports empty rather than blaming the schema', () => {
    const resolved = resolveConversationField(
      { labelKey: label, column: ConversationsField.TotalTokens, format: ConversationFieldFormat.Count },
      { ...RECORD, total_tokens: 'not-a-number' },
    );

    expect(resolved.state).toBe(ConversationFieldState.Empty);
  });

  test('an unformatted column falls back to its text value', () => {
    const resolved = resolveConversationField({ labelKey: label, column: ConversationsField.ChatId }, RECORD);

    expect(resolved.text).toBe(RECORD.chat_id);
  });
});

describe('countFeedbackDirections', () => {
  const row = (rate: number | null): ConversationFeedbackRow => ({
    response_id: 'chatcmpl-x',
    rate,
    request_time: '2026-07-20T19:12:59.268Z',
  });

  test('counts rate above zero as positive and the rest as negative', () => {
    expect(countFeedbackDirections([row(1), row(1), row(0)])).toEqual({ rating_up: 2, rating_down: 1 });
  });

  test('an unrated row counts in neither direction', () => {
    expect(countFeedbackDirections([row(null), row(1)])).toEqual({ rating_up: 1, rating_down: 0 });
  });

  test('no rows reports zero in both directions rather than nothing', () => {
    expect(countFeedbackDirections([])).toEqual({ rating_up: 0, rating_down: 0 });
  });
});

describe('isFeedbackPartial', () => {
  const rows: ConversationFeedbackRow[] = [{ response_id: 'a', rate: 1, request_time: 1 }];

  test('a total above the row count is partial', () => {
    expect(isFeedbackPartial(rows, 6)).toBe(true);
  });

  test('a total matching the row count is complete', () => {
    expect(isFeedbackPartial(rows, 1)).toBe(false);
  });

  test('an absent total cannot be judged partial', () => {
    expect(isFeedbackPartial(rows, null)).toBe(false);
  });
});
