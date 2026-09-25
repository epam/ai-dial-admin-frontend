'use client';

import { FC } from 'react';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionFeedbackRow } from '@/src/models/analytics/sessions-trace';
import {
  feedbackRowCounts,
  isFeedbackContested,
  isFeedbackPartial,
  isFeedbackReRated,
} from '@/src/utils/analytics/session-detail-fields';
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

interface EntryProps {
  row: SessionFeedbackRow;
  isCommentTextReadable: boolean;
}

const FeedbackEntry: FC<EntryProps> = ({ row, isCommentTextReadable }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-0.5 rounded border border-primary p-2">
      <div className="flex items-center justify-between gap-2 dial-tiny-text">
        <span className="text-secondary">{row.response_id ?? UNAVAILABLE_VALUE}</span>
        <RatingDirection row={row} />
      </div>
      <p className="dial-tiny-text text-secondary">
        {isFeedbackReRated(row)
          ? t(SessionsTraceI18nKey.DetailRatingWindow, {
              first: formatDateTimeToLocalString(row.first_rate_time ?? undefined),
              last: formatDateTimeToLocalString(row.last_rate_time ?? undefined),
            })
          : formatDateTimeToLocalString(row.last_rate_time ?? undefined)}
      </p>
      {isFeedbackContested(row) && (
        <p className="dial-tiny-text text-warning">{t(SessionsTraceI18nKey.DetailRatingContested)}</p>
      )}
      <p className="dial-tiny-text text-secondary">
        {t(SessionsTraceI18nKey.DetailComment)} <CommentValue row={row} isReadable={isCommentTextReadable} />
      </p>
    </div>
  );
};

interface Props {
  rows: SessionFeedbackRow[];
  total: number | null;
  isCommentTextReadable: boolean;
}

const SessionFeedbackPanel: FC<Props> = ({ rows, total, isCommentTextReadable }) => {
  const t = useI18n();

  if (!rows.length) {
    return <p className="dial-small-text text-secondary">{t(SessionsTraceI18nKey.DetailNoRatings)}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {isFeedbackPartial(rows, total) && (
        <p className="dial-tiny-text text-secondary">
          {t(SessionsTraceI18nKey.DetailFeedbackPartial, { shown: rows.length, total: total ?? rows.length })}
        </p>
      )}
      {rows.map((row, index) => (
        <FeedbackEntry
          key={`${row.response_id ?? index}-${index}`}
          row={row}
          isCommentTextReadable={isCommentTextReadable}
        />
      ))}
    </div>
  );
};

export default SessionFeedbackPanel;
