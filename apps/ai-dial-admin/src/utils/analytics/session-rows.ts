import { ResponseRatingsField, SessionRatingCounts, SessionRow } from '@/src/models/analytics/sessions-trace';
import { SessionsSource } from '@/src/models/analytics/sessions-source';
import { toNumber } from '@/src/utils/analytics/scalar';
import { canonicalSessionRow } from '@/src/utils/analytics/sessions-source';

const UNRESOLVED: SessionRatingCounts = {
  rating_up: null,
  rating_down: null,
  provable_down: null,
  captured_form: null,
  rate_events: null,
};

const sum = (...values: unknown[]): number =>
  values.reduce<number>((total, value) => total + (toNumber(value as number | string | null) ?? 0), 0);

export const sessionRatingCountsOf = (
  record: Record<string, unknown>,
  namespace: string | null,
): SessionRatingCounts => {
  if (!namespace) {
    return UNRESOLVED;
  }

  const read = (field: ResponseRatingsField): unknown => record[`${namespace}.${field}`];

  return {
    rating_up: sum(read(ResponseRatingsField.RatePosCount)),
    rating_down: sum(read(ResponseRatingsField.RateZeroCount), read(ResponseRatingsField.RateNegCount)),
    provable_down: sum(read(ResponseRatingsField.RateBoolFalseCount), read(ResponseRatingsField.RateNegCount)),
    captured_form: sum(read(ResponseRatingsField.RateRawCount)),
    rate_events: sum(read(ResponseRatingsField.RateEventCount)),
  };
};

export const negativeRatingGap = ({ rating_down: down, provable_down: provable }: SessionRatingCounts): number =>
  down == null || provable == null ? 0 : Math.max(down - provable, 0);

export const hasNegativeRatingCaveat = (counts: SessionRatingCounts): boolean => negativeRatingGap(counts) > 0;

export const ratedSessionRow = (source: SessionsSource, raw: Record<string, unknown>): SessionRow =>
  ({
    ...canonicalSessionRow(source, raw),
    ...sessionRatingCountsOf(raw, source.ratingEnrichment),
  }) as unknown as SessionRow;
