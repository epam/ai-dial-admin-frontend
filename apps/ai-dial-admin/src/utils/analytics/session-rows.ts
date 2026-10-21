import { SessionRatingCounts, SessionRatingRow, SessionRow } from '@/src/models/analytics/sessions-trace';
import { toNumber } from '@/src/utils/analytics/scalar';

const UNRESOLVED: SessionRatingCounts = {
  rating_up: null,
  rating_down: null,
  provable_down: null,
  captured_form: null,
  rate_events: null,
};

const NONE: SessionRatingCounts = {
  rating_up: 0,
  rating_down: 0,
  provable_down: 0,
  captured_form: 0,
  rate_events: 0,
};

const sum = (...values: (number | string | null)[]): number =>
  values.reduce<number>((total, value) => total + (toNumber(value) ?? 0), 0);

export const sessionRatingCounts = (row?: SessionRatingRow): SessionRatingCounts =>
  row
    ? {
        rating_up: sum(row.rating_up),
        rating_down: sum(row.rate_zero, row.rate_negative),
        provable_down: sum(row.rate_bool_false, row.rate_negative),
        captured_form: sum(row.rate_raw),
        rate_events: sum(row.rate_events),
      }
    : NONE;

export const negativeRatingGap = ({ rating_down: down, provable_down: provable }: SessionRatingCounts): number =>
  down == null || provable == null ? 0 : Math.max(down - provable, 0);

export const hasNegativeRatingCaveat = (counts: SessionRatingCounts): boolean => negativeRatingGap(counts) > 0;

const countsByChatId = (ratingRows: SessionRatingRow[]): Map<string, SessionRatingCounts> =>
  new Map(ratingRows.map((row) => [row.chat_id, sessionRatingCounts(row)]));

export const attachRatings = (rows: SessionRow[], ratingRows: SessionRatingRow[]): SessionRow[] => {
  const counts = countsByChatId(ratingRows);

  return rows.map((row) => ({ ...row, ...(counts.get(row.client_session_id) ?? NONE) }));
};

export const unresolvedRatings = (rows: SessionRow[]): SessionRow[] => rows.map((row) => ({ ...row, ...UNRESOLVED }));
