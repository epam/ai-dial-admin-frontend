import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import SessionFeedbackPanel from '@/src/components/Analytics/SessionsTrace/Detail/SessionFeedbackPanel';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { SessionFeedbackRow } from '@/src/models/analytics/sessions-trace';

const row = (overrides: Partial<SessionFeedbackRow> = {}): SessionFeedbackRow => ({
  response_id: 'chatcmpl-a',
  first_rate_time: '2026-07-20T19:12:59.268Z',
  last_rate_time: '2026-07-20T19:12:59.268Z',
  rate_pos_count: 1,
  rate_zero_count: 0,
  rate_neg_count: 0,
  rate_distinct_count: 1,
  comment_count: 0,
  ...overrides,
});

const setup = (rows: SessionFeedbackRow[] = [row()], total: number | null = rows.length, isReadable = false) =>
  render(<SessionFeedbackPanel rows={rows} total={total} isCommentTextReadable={isReadable} />);

describe('SessionFeedbackPanel', () => {
  test('states that a session carries no ratings rather than rendering an empty list', () => {
    setup([], 0);

    expect(screen.getByText(SessionsTraceI18nKey.DetailNoRatings)).toBeInTheDocument();
  });

  test('reads a response direction from its own counts', () => {
    setup([row(), row({ response_id: 'b', rate_pos_count: 0, rate_zero_count: 1 })]);

    expect(screen.getByText(SessionsTraceI18nKey.DetailRatingPositive)).toBeInTheDocument();
    expect(screen.getByText(SessionsTraceI18nKey.DetailRatingNegative)).toBeInTheDocument();
  });

  test('reads a zero-normalized rating as negative', () => {
    setup([row({ rate_pos_count: 0, rate_zero_count: 1 })]);

    expect(screen.getByText(SessionsTraceI18nKey.DetailRatingNegative)).toBeInTheDocument();
  });

  test('states a window for a re-rated response', () => {
    setup([row({ first_rate_time: '2026-07-20T19:00:00.000Z', last_rate_time: '2026-07-20T19:12:59.268Z' })]);

    expect(screen.getByText(SessionsTraceI18nKey.DetailRatingWindow)).toBeInTheDocument();
  });

  test('states a single time for a response rated once', () => {
    setup();

    expect(screen.queryByText(SessionsTraceI18nKey.DetailRatingWindow)).toBeNull();
  });

  test('says so where a response own ratings disagree', () => {
    setup([row({ rate_distinct_count: 2 })]);

    expect(screen.getByText(SessionsTraceI18nKey.DetailRatingContested)).toBeInTheDocument();
  });

  test('makes no disagreement claim for a response rated one way', () => {
    setup();

    expect(screen.queryByText(SessionsTraceI18nKey.DetailRatingContested)).toBeNull();
  });

  test('states a comment count without the text where the schema does not offer it', () => {
    setup([row({ comment_count: 2 })], 1, false);

    expect(screen.getByText(SessionsTraceI18nKey.DetailCommentCount, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(SessionsTraceI18nKey.DetailCommentRestricted, { exact: false })).toBeInTheDocument();
  });

  test('renders the comment text where the schema offers it', () => {
    setup([row({ comment_count: 1, comment_sample: 'The rotation steps were wrong.' })], 1, true);

    expect(screen.getByText('The rotation steps were wrong.', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(SessionsTraceI18nKey.DetailCommentRestricted, { exact: false })).toBeNull();
  });

  test('distinguishes no comments from a comment it may not read', () => {
    setup([row({ comment_count: 0 })], 1, true);

    expect(screen.getByText(SessionsTraceI18nKey.DetailNoComments)).toBeInTheDocument();
    expect(screen.queryByText(SessionsTraceI18nKey.DetailCommentCount)).toBeNull();
  });

  test('declares a truncated list partial', () => {
    setup([row()], 6);

    expect(screen.getByText(SessionsTraceI18nKey.DetailFeedbackPartial)).toBeInTheDocument();
  });

  test('makes no partial claim for a complete list', () => {
    setup([row()], 1);

    expect(screen.queryByText(SessionsTraceI18nKey.DetailFeedbackPartial)).toBeNull();
  });

  test('a response whose events carried no rating value is labelled neither way', () => {
    setup([row({ rate_pos_count: 0, rate_zero_count: 0, rate_neg_count: 0, comment_count: 1 })]);

    expect(screen.getByText(SessionsTraceI18nKey.DetailRatingNoValue)).toBeInTheDocument();
    expect(screen.queryByText(SessionsTraceI18nKey.DetailRatingNegative)).toBeNull();
    expect(screen.queryByText(SessionsTraceI18nKey.DetailRatingPositive)).toBeNull();
  });

  test('states the comment count alongside the text an elevated caller may read', () => {
    setup([row({ comment_count: 3, comment_sample: 'Actually fine' })], 1, true);

    expect(screen.getByText(SessionsTraceI18nKey.DetailCommentCount, { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Actually fine', { exact: false })).toBeInTheDocument();
  });

  test('uses a singular label for one comment', () => {
    const { unmount } = setup([row({ comment_count: 1 })], 1, false);

    expect(screen.getByText(SessionsTraceI18nKey.DetailCommentCountOne, { exact: false })).toBeInTheDocument();
    unmount();

    setup([row({ comment_count: 4 })], 1, false);

    expect(screen.queryByText(SessionsTraceI18nKey.DetailCommentCountOne, { exact: false })).toBeNull();
    expect(screen.getByText(SessionsTraceI18nKey.DetailCommentCount, { exact: false })).toBeInTheDocument();
  });
});
