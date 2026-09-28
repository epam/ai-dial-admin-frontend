import { describe, expect, test } from 'vitest';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import {
  SessionDetailRow,
  SessionFeedbackRow,
  SessionFieldFormat,
  SessionFieldState,
  SessionTraceFigures,
  SessionsField,
} from '@/src/models/analytics/sessions-trace';
import {
  sessionTitle,
  feedbackRowCounts,
  isFeedbackContested,
  isFeedbackPartial,
  isFeedbackReRated,
  resolveSessionField,
} from '@/src/utils/analytics/session-detail-fields';

const RECORD: SessionDetailRow = {
  client_session_id: 'Lrr0e6L5bpTND3IY_dN0_',
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
  deployments: ['gpt-4o'],
  avg_duration_ms: 0,
};

const label = SessionsTraceI18nKey.DetailTokensIn;

describe('sessionTitle', () => {
  test('states the insight title when the enrichment carries one', () => {
    expect(sessionTitle({ ...RECORD, 'session_insights.title': 'Refund policy for EU orders' })).toBe(
      'Refund policy for EU orders',
    );
  });

  test('trims the surrounding whitespace of a title', () => {
    expect(sessionTitle({ ...RECORD, 'session_insights.title': '  Cost of a rerun  ' })).toBe('Cost of a rerun');
  });

  test('reports no title when the enrichment has no row', () => {
    expect(sessionTitle(RECORD)).toBeNull();
  });

  test('reports no title for a null, empty or whitespace-only title', () => {
    for (const title of [null, '', '   ']) {
      expect(sessionTitle({ ...RECORD, 'session_insights.title': title })).toBeNull();
    }
  });

  // Both callers render the session id beside the title, so falling back to it would print the id
  // twice and name the session after its own hash.
  test('never falls back to the session id', () => {
    expect(sessionTitle(RECORD)).not.toBe(RECORD.client_session_id);
  });

  // The grid's identity column and the header read the same helper, so one session cannot be named
  // two different things in the two places.
  test('resolves a grid row and a detail row identically', () => {
    const title = 'Refund policy for EU orders';

    expect(sessionTitle({ 'session_insights.title': title })).toBe(
      sessionTitle({ ...RECORD, 'session_insights.title': title }),
    );
  });
});

describe('resolveSessionField', () => {
  test('a column absent from the row is unavailable, not empty', () => {
    const resolved = resolveSessionField(
      { labelKey: label, column: SessionsField.Traces, format: SessionFieldFormat.List },
      RECORD,
    );

    expect(resolved.state).toBe(SessionFieldState.Unavailable);
    expect(resolved.text).toBe(UNAVAILABLE_VALUE);
  });

  test('a column present in the row with a null value is empty, not unavailable', () => {
    const resolved = resolveSessionField(
      { labelKey: label, column: SessionsField.Traces, format: SessionFieldFormat.List },
      { ...RECORD, traces: null },
    );

    expect(resolved.state).toBe(SessionFieldState.Empty);
  });

  test('a definition with no column is unavailable and renders the marker', () => {
    expect(resolveSessionField({ labelKey: label }, RECORD)).toEqual({
      labelKey: label,
      state: SessionFieldState.Unavailable,
      text: UNAVAILABLE_VALUE,
    });
  });

  test('a bound column with a value is available and formatted', () => {
    const resolved = resolveSessionField(
      { labelKey: label, column: SessionsField.PromptTokens, format: SessionFieldFormat.Count },
      RECORD,
    );

    expect(resolved.state).toBe(SessionFieldState.Available);
    expect(resolved.text).toBe('4.3 M');
  });

  // The distinction the design exists to protect: `0` is a finding, and `value || marker` would erase it.
  test('a zero renders as a number, not as the unavailable marker', () => {
    const resolved = resolveSessionField(
      { labelKey: label, column: SessionsField.SuccessCount, format: SessionFieldFormat.Count },
      RECORD,
    );

    expect(resolved.state).toBe(SessionFieldState.Available);
    expect(resolved.text).toBe('0');
    expect(resolved.text).not.toBe(UNAVAILABLE_VALUE);
  });

  test('an empty string is empty, not unavailable', () => {
    const resolved = resolveSessionField({ labelKey: label, column: SessionsField.ProjectId }, RECORD);

    expect(resolved.state).toBe(SessionFieldState.Empty);
    expect(resolved.text).toBe('');
  });

  test('a null value is empty, not unavailable', () => {
    const resolved = resolveSessionField(
      { labelKey: label, column: SessionsField.UserHash },
      {
        ...RECORD,
        user_hash: null,
      },
    );

    expect(resolved.state).toBe(SessionFieldState.Empty);
  });

  test('formats cost with the shared currency formatter', () => {
    const resolved = resolveSessionField(
      { labelKey: label, column: SessionsField.TotalPrice, format: SessionFieldFormat.Cost },
      RECORD,
    );

    expect(resolved.text).toBe('$10.8');
  });

  test('formats a timestamp rather than echoing the wire value', () => {
    const resolved = resolveSessionField(
      { labelKey: label, column: SessionsField.FirstRequestTime, format: SessionFieldFormat.DateTime },
      RECORD,
    );

    expect(resolved.state).toBe(SessionFieldState.Available);
    expect(resolved.text).not.toBe(RECORD.first_request_time);
  });

  test('an unformattable value reports empty rather than blaming the schema', () => {
    const resolved = resolveSessionField(
      { labelKey: label, column: SessionsField.TotalTokens, format: SessionFieldFormat.Count },
      { ...RECORD, total_tokens: 'not-a-number' },
    );

    expect(resolved.state).toBe(SessionFieldState.Empty);
  });

  test('an unformatted column falls back to its text value', () => {
    const resolved = resolveSessionField({ labelKey: label, column: SessionsField.ChatId }, RECORD);

    expect(resolved.text).toBe(RECORD.client_session_id);
  });
});

const feedbackRow = (overrides: Partial<SessionFeedbackRow> = {}): SessionFeedbackRow => ({
  response_id: 'chatcmpl-x',
  first_rate_time: '2026-07-20T19:12:59.268Z',
  last_rate_time: '2026-07-20T19:12:59.268Z',
  rate_pos_count: 1,
  rate_zero_count: 0,
  rate_neg_count: 0,
  rate_distinct_count: 1,
  comment_count: 0,
  ...overrides,
});

describe('feedbackRowCounts', () => {
  test('reads a positive response from its own count', () => {
    expect(feedbackRowCounts(feedbackRow())).toEqual({ rating_up: 1, rating_down: 0 });
  });

  test('composes the negative side from the zero and negative counts', () => {
    expect(feedbackRowCounts(feedbackRow({ rate_pos_count: 0, rate_zero_count: 2, rate_neg_count: 1 }))).toEqual({
      rating_up: 0,
      rating_down: 3,
    });
  });

  test('reads counts returned as strings, as a ClickHouse aggregate may', () => {
    expect(feedbackRowCounts(feedbackRow({ rate_pos_count: '3' }))).toEqual({ rating_up: 3, rating_down: 0 });
  });

  test('treats an absent count as zero', () => {
    expect(feedbackRowCounts(feedbackRow({ rate_pos_count: null }))).toEqual({ rating_up: 0, rating_down: 0 });
  });
});

describe('isFeedbackContested', () => {
  test('more than one distinct rating value is contested', () => {
    expect(isFeedbackContested(feedbackRow({ rate_distinct_count: 2 }))).toBe(true);
  });

  test('a single distinct value is not', () => {
    expect(isFeedbackContested(feedbackRow({ rate_distinct_count: 1 }))).toBe(false);
  });

  test('an absent count is not', () => {
    expect(isFeedbackContested(feedbackRow({ rate_distinct_count: null }))).toBe(false);
  });
});

describe('isFeedbackReRated', () => {
  test('differing first and last rating times are a window', () => {
    expect(
      isFeedbackReRated(
        feedbackRow({ first_rate_time: '2026-07-20T19:00:00.000Z', last_rate_time: '2026-07-20T19:12:59.268Z' }),
      ),
    ).toBe(true);
  });

  test('one moment is not a window', () => {
    expect(isFeedbackReRated(feedbackRow())).toBe(false);
  });

  test('an unreadable time is not a window', () => {
    expect(isFeedbackReRated(feedbackRow({ first_rate_time: null }))).toBe(false);
  });
});

describe('isFeedbackPartial', () => {
  const rows: SessionFeedbackRow[] = [feedbackRow({ response_id: 'a' })];

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
