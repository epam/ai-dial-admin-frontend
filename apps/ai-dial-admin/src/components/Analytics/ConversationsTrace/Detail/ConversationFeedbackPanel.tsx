'use client';

import { FC } from 'react';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationFeedbackRow } from '@/src/models/analytics/conversations-trace';
import { isFeedbackPartial } from '@/src/utils/analytics/conversation-detail-fields';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  rows: ConversationFeedbackRow[];
  total: number | null;
}

const ConversationFeedbackPanel: FC<Props> = ({ rows, total }) => {
  const t = useI18n();

  if (!rows.length) {
    return <p className="dial-small-text text-secondary">{t(ConversationsTraceI18nKey.DetailNoRatings)}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {isFeedbackPartial(rows, total) && (
        <p className="dial-tiny-text text-secondary">
          {t(ConversationsTraceI18nKey.DetailFeedbackPartial, { shown: rows.length, total: total ?? rows.length })}
        </p>
      )}
      {rows.map((row, index) => (
        <div
          key={`${row.response_id ?? index}-${index}`}
          className="flex flex-col gap-0.5 rounded border border-primary p-2"
        >
          <div className="flex items-center justify-between gap-2 dial-tiny-text">
            <span className="text-secondary">
              {t(ConversationsTraceI18nKey.DetailTurn)}{' '}
              <span title={t(ConversationsTraceI18nKey.DetailNotRecorded)}>{UNAVAILABLE_VALUE}</span>
            </span>
            <span className={(row.rate ?? 0) > 0 ? 'text-success' : 'text-error'}>
              {t(
                (row.rate ?? 0) > 0
                  ? ConversationsTraceI18nKey.DetailRatingPositive
                  : ConversationsTraceI18nKey.DetailRatingNegative,
              )}
            </span>
          </div>
          <p className="dial-tiny-text text-secondary">{formatDateTimeToLocalString(row.request_time ?? undefined)}</p>
          <p className="dial-tiny-text text-secondary">
            {t(ConversationsTraceI18nKey.DetailComment)}{' '}
            <span title={t(ConversationsTraceI18nKey.DetailNotRecorded)}>{UNAVAILABLE_VALUE}</span>
          </p>
        </div>
      ))}
    </div>
  );
};

export default ConversationFeedbackPanel;
