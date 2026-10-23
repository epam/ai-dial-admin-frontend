'use client';

import { FC, ReactNode } from 'react';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionFeedbackRow } from '@/src/models/analytics/sessions-trace';
import { feedbackRowCounts, isFeedbackContested, isFeedbackReRated } from '@/src/utils/analytics/session-detail-fields';
import { toNumber } from '@/src/utils/analytics/scalar';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

// The count is stated whatever the caller may read, because it is the only figure that says how much
// feedback the sample stands for: the service picks `comment_sample` lexicographically, so with a count
// above one the text is an arbitrary member of a set the reader is not being shown.
const CommentValue: FC<{ row: SessionFeedbackRow; isReadable: boolean }> = ({ row, isReadable }) => {
  const t = useI18n();
  const count = toNumber(row.comment_count) ?? 0;

  if (count === 0) {
    return <span className="italic">{t(SessionsTraceI18nKey.DetailNoComments)}</span>;
  }

  const countText = t(
    count === 1 ? SessionsTraceI18nKey.DetailCommentCountOne : SessionsTraceI18nKey.DetailCommentCount,
    { count },
  );

  return (
    <span>
      {countText}
      {isReadable && row.comment_sample && <span className="text-primary"> · {row.comment_sample}</span>}
      {!isReadable && <> · {t(SessionsTraceI18nKey.DetailCommentRestricted)}</>}
    </span>
  );
};

// A response whose events carried no rating value at all — a comment left without a thumb — is neither
// positive nor negative, and labelling it either way contradicts the panel's own figures, which count it
// in neither direction.
const RatingDirection: FC<{ row: SessionFeedbackRow }> = ({ row }) => {
  const t = useI18n();
  const { rating_up: up, rating_down: down } = feedbackRowCounts(row);

  if ((up ?? 0) > 0) {
    return <span className="text-success">{t(SessionsTraceI18nKey.DetailRatingPositive)}</span>;
  }
  if ((down ?? 0) > 0) {
    return <span className="text-error">{t(SessionsTraceI18nKey.DetailRatingNegative)}</span>;
  }

  return <span className="text-secondary">{t(SessionsTraceI18nKey.DetailRatingNoValue)}</span>;
};

// Laid out as the span rail's fact cards are — a label over its value, rows divided — so a rating reads as
// one more card of the rail rather than a differently built block beside them.
const EntryRow: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col py-1">
    <span className="text-secondary dial-tiny-text">{label}</span>
    {children}
  </div>
);

interface Props {
  row: SessionFeedbackRow;
  isCommentTextReadable: boolean;
}

const FeedbackEntry: FC<Props> = ({ row, isCommentTextReadable }) => {
  const t = useI18n();
  const ratedAt = isFeedbackReRated(row)
    ? t(SessionsTraceI18nKey.DetailRatingWindow, {
        first: formatDateTimeToLocalString(row.first_rate_time ?? undefined),
        last: formatDateTimeToLocalString(row.last_rate_time ?? undefined),
      })
    : formatDateTimeToLocalString(row.last_rate_time ?? undefined);

  return (
    <div className="shrink-0 divide-y divide-tertiary rounded border border-primary bg-layer-3 px-3">
      <EntryRow label={t(SessionsTraceI18nKey.DetailRatedResponse)}>
        <span className="flex items-start justify-between gap-2 dial-tiny-text">
          <span className="break-all font-mono text-primary">{row.response_id ?? UNAVAILABLE_VALUE}</span>
          <span className="shrink-0">
            <RatingDirection row={row} />
          </span>
        </span>
      </EntryRow>
      <EntryRow label={t(SessionsTraceI18nKey.DetailRatedAt)}>
        <span className="text-primary dial-tiny-text">{ratedAt}</span>
        {isFeedbackContested(row) && (
          <span className="text-warning dial-tiny-text">{t(SessionsTraceI18nKey.DetailRatingContested)}</span>
        )}
      </EntryRow>
      <EntryRow label={t(SessionsTraceI18nKey.DetailComment)}>
        <span className="break-words text-secondary dial-tiny-text">
          <CommentValue row={row} isReadable={isCommentTextReadable} />
        </span>
      </EntryRow>
    </div>
  );
};

export default FeedbackEntry;
