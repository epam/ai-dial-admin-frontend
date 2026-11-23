import { describe, expect, test } from 'vitest';

import { SessionsSource } from '@/src/models/analytics/sessions-source';
import {
  hasNegativeRatingCaveat,
  negativeRatingGap,
  ratedSessionRow,
  sessionRatingCountsOf,
} from '@/src/utils/analytics/session-rows';
import { defaultSessionsSource } from '@/src/utils/analytics/sessions-source';

const NAMESPACE = 'response_ratings';

const ratingRecord = (counts: Record<string, unknown> = {}, namespace = NAMESPACE): Record<string, unknown> =>
  Object.fromEntries(Object.entries(counts).map(([fieldName, count]) => [`${namespace}.${fieldName}`, count]));

const RESOLVED_ZERO = { rating_up: 0, rating_down: 0, provable_down: 0, captured_form: 0, rate_events: 0 };

const UNRESOLVED = {
  rating_up: null,
  rating_down: null,
  provable_down: null,
  captured_form: null,
  rate_events: null,
};

describe('sessionRatingCountsOf', () => {
  test('composes the negative figure from the zero and negative counts', () => {
    expect(
      sessionRatingCountsOf(ratingRecord({ rate_pos_count: 2, rate_zero_count: 3, rate_neg_count: 1 }), NAMESPACE),
    ).toMatchObject({ rating_up: 2, rating_down: 4 });
  });

  test('reports one like and one dislike as one each', () => {
    expect(sessionRatingCountsOf(ratingRecord({ rate_pos_count: 1, rate_neg_count: 1 }), NAMESPACE)).toMatchObject({
      rating_up: 1,
      rating_down: 1,
    });
  });

  test('counts a provable negative from the boolean-false and negative columns', () => {
    expect(
      sessionRatingCountsOf(
        ratingRecord({ rate_zero_count: 5, rate_neg_count: 2, rate_bool_false_count: 3 }),
        NAMESPACE,
      ),
    ).toMatchObject({ rating_down: 7, provable_down: 5 });
  });

  test('carries the captured form and the rate events', () => {
    expect(sessionRatingCountsOf(ratingRecord({ rate_raw_count: 2, rate_event_count: 6 }), NAMESPACE)).toMatchObject({
      captured_form: 2,
      rate_events: 6,
    });
  });

  test('reads a count returned as a string, as a ClickHouse aggregate may', () => {
    expect(sessionRatingCountsOf(ratingRecord({ rate_pos_count: '4', rate_zero_count: '2' }), NAMESPACE)).toMatchObject(
      {
        rating_up: 4,
        rating_down: 2,
      },
    );
  });

  test.each([
    ['a null count', null],
    ['an unparseable count', 'nonsense'],
  ])('treats %s as zero rather than as a rating', (_label, count) => {
    expect(sessionRatingCountsOf(ratingRecord({ rate_pos_count: count }), NAMESPACE)).toMatchObject({ rating_up: 0 });
  });

  test('reports a resolved zero where the enrichment has no row for the session', () => {
    expect(sessionRatingCountsOf({ client_session_id: 'chat-1' }, NAMESPACE)).toEqual(RESOLVED_ZERO);
  });

  test('reads only the namespace it is given', () => {
    expect(sessionRatingCountsOf(ratingRecord({ rate_pos_count: 3 }, 'other_ratings'), NAMESPACE)).toEqual(
      RESOLVED_ZERO,
    );
  });

  test('reports every figure unresolved without a rating enrichment', () => {
    expect(sessionRatingCountsOf(ratingRecord({ rate_pos_count: 3 }), null)).toEqual(UNRESOLVED);
  });
});

describe('ratedSessionRow', () => {
  const RATED_SOURCE: SessionsSource = { ...defaultSessionsSource(), ratingEnrichment: NAMESPACE };

  const CUSTOM_SOURCE: SessionsSource = {
    baseTable: 'agent_runs',
    sessionId: 'run_key',
    time: 'ended_at',
    project: null,
    title: null,
    cost: 'spend',
    turns: null,
    enrichments: [NAMESPACE],
    ratingEnrichment: NAMESPACE,
  };

  test('attaches the rating counts read from the row itself', () => {
    const row = ratedSessionRow(RATED_SOURCE, {
      client_session_id: 'chat-1',
      project_id: 'data-team',
      ...ratingRecord({ rate_pos_count: 2, rate_zero_count: 3 }),
    });

    expect(row).toMatchObject({ client_session_id: 'chat-1', project_id: 'data-team', rating_up: 2, rating_down: 3 });
  });

  test('copies role-bound fields onto their canonical names, keeping the originals', () => {
    const row = ratedSessionRow(CUSTOM_SOURCE, { run_key: 'run-1', ended_at: 5, spend: '0.5', region: 'eu' });

    expect(row).toMatchObject({
      run_key: 'run-1',
      client_session_id: 'run-1',
      last_request_time: 5,
      total_price: '0.5',
      region: 'eu',
    });
  });

  test('leaves the rating figures unresolved without a rating enrichment', () => {
    const row = ratedSessionRow(defaultSessionsSource(), { client_session_id: 'chat-1' });

    expect(row).toMatchObject({ client_session_id: 'chat-1', ...UNRESOLVED });
  });

  test('does not mutate the record it was given', () => {
    const raw = { run_key: 'run-1', ended_at: 5 };

    ratedSessionRow(CUSTOM_SOURCE, raw);

    expect(raw).toEqual({ run_key: 'run-1', ended_at: 5 });
  });
});

describe('negativeRatingGap', () => {
  test('is the part of the negative figure no captured form accounts for', () => {
    expect(
      negativeRatingGap({ rating_up: 0, rating_down: 7, provable_down: 5, captured_form: 5, rate_events: 7 }),
    ).toBe(2);
  });

  test('never reports a negative gap', () => {
    expect(
      negativeRatingGap({ rating_up: 0, rating_down: 2, provable_down: 5, captured_form: 5, rate_events: 2 }),
    ).toBe(0);
  });
});

describe('hasNegativeRatingCaveat', () => {
  test('a partially attributable figure carries one', () => {
    expect(
      hasNegativeRatingCaveat({ rating_up: 0, rating_down: 7, provable_down: 5, captured_form: 5, rate_events: 7 }),
    ).toBe(true);
  });

  test('a fully attributable figure carries none', () => {
    expect(
      hasNegativeRatingCaveat({ rating_up: 1, rating_down: 3, provable_down: 3, captured_form: 4, rate_events: 4 }),
    ).toBe(false);
  });

  test('an unrated session carries none', () => {
    expect(
      hasNegativeRatingCaveat({ rating_up: 0, rating_down: 0, provable_down: 0, captured_form: 0, rate_events: 0 }),
    ).toBe(false);
  });

  test('an unresolved figure carries none', () => {
    expect(
      hasNegativeRatingCaveat({
        rating_up: null,
        rating_down: null,
        provable_down: null,
        captured_form: null,
        rate_events: null,
      }),
    ).toBe(false);
  });
});

describe('negativeRatingGap :: unresolved figures', () => {
  test('reports no gap where the provable count was never resolved', () => {
    expect(negativeRatingGap({ rating_up: 0, rating_down: 4, provable_down: null })).toBe(0);
  });

  test('reports no gap where the provable count is absent', () => {
    expect(negativeRatingGap({ rating_up: 0, rating_down: 4 })).toBe(0);
  });

  test('reports no gap where the negative figure was never resolved', () => {
    expect(negativeRatingGap({ rating_up: null, rating_down: null, provable_down: 0 })).toBe(0);
  });
});
