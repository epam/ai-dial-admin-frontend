'use client';

import { FC } from 'react';

import FeedbackEntry from '@/src/components/Analytics/SessionsTrace/Detail/FeedbackEntry';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionFeedbackRow } from '@/src/models/analytics/sessions-trace';
import { isFeedbackPartial } from '@/src/utils/analytics/session-detail-fields';

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
