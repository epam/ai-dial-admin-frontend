'use client';

import { FC } from 'react';

import RatingCounts from '@/src/components/Analytics/SessionsTrace/RatingCounts';
import FeedbackEntry from '@/src/components/Analytics/SessionsTrace/Detail/FeedbackEntry';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionFeedbackPage, SessionRatingCounts } from '@/src/models/analytics/sessions-trace';
import { isFeedbackPartial } from '@/src/utils/analytics/session-detail-fields';

interface Props {
  ratings: SessionRatingCounts | null;
  feedback: SessionFeedbackPage | null;
}

const SessionFeedbackPanel: FC<Props> = ({ ratings, feedback }) => {
  const t = useI18n();
  const rows = feedback?.rows ?? [];
  const total = feedback?.total ?? null;
  const isListed = feedback?.isAvailable ?? false;
  const hasRatings = !!ratings?.rating_up || !!ratings?.rating_down || rows.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {hasRatings && ratings && <RatingCounts counts={ratings} />}
      {!hasRatings && (ratings || isListed) && (
        <p className="dial-small-text text-secondary">{t(SessionsTraceI18nKey.DetailNoRatings)}</p>
      )}
      {isListed && rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {isFeedbackPartial(rows, total) && (
            <p className="dial-tiny-text text-secondary">
              {t(SessionsTraceI18nKey.DetailFeedbackPartial, { shown: rows.length, total: total ?? `${rows.length}+` })}
            </p>
          )}
          {rows.map((row, index) => (
            <FeedbackEntry
              key={`${row.response_id ?? index}-${index}`}
              row={row}
              isCommentTextReadable={feedback?.isCommentTextReadable ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionFeedbackPanel;
