'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC } from 'react';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationFieldState,
  ConversationsField,
  ResolvedConversationField,
  ResolvedInsightFields,
} from '@/src/models/analytics/conversations-trace';
import { readableWords } from '@/src/utils/analytics/conversation-formatting';
import { resolutionBadgeClass, sentimentBadgeClass } from '@/src/utils/analytics/conversation-insights';

const isReadable = (field?: ResolvedConversationField): field is ResolvedConversationField =>
  field?.state === ConversationFieldState.Available;

interface BadgeProps {
  field?: ResolvedConversationField;
  className: string;
  label: string;
}

const InsightBadge: FC<BadgeProps> = ({ field, className, label }) => {
  const t = useI18n();

  if (!isReadable(field)) {
    return null;
  }

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-secondary dial-tiny-text">{t(label)}</span>
      <span className={classNames('rounded px-2 py-0.5 dial-tiny-semi-text', className)}>
        {readableWords(field.text)}
      </span>
    </span>
  );
};

interface TermProps {
  field?: ResolvedConversationField;
}

const InsightTerm: FC<TermProps> = ({ field }) => {
  const t = useI18n();

  if (!field || field.state === ConversationFieldState.Empty) {
    return null;
  }

  return (
    <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-4">
      <dt className="text-secondary dial-tiny-text">{t(field.labelKey)}</dt>
      <dd className="min-w-0 text-right text-primary dial-tiny-text">
        {field.state === ConversationFieldState.Unavailable ? (
          <span className="text-secondary" title={t(ConversationsTraceI18nKey.DetailNotRecorded)}>
            {UNAVAILABLE_VALUE}
          </span>
        ) : (
          <DialEllipsisTooltip text={field.text} />
        )}
      </dd>
    </div>
  );
};

interface Props {
  fields: ResolvedInsightFields;
}

const ConversationInsightsPanel: FC<Props> = ({ fields }) => {
  const summary = fields[ConversationsField.InsightSummary];
  const sentiment = fields[ConversationsField.InsightSentiment];
  const resolution = fields[ConversationsField.InsightResolutionStatus];
  const hasBadge = isReadable(sentiment) || isReadable(resolution);

  return (
    <div className="flex flex-col gap-3">
      {isReadable(summary) && <p className="text-primary dial-small-text">{summary.text}</p>}
      {hasBadge && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <InsightBadge
            field={sentiment}
            className={sentimentBadgeClass(sentiment?.text ?? '')}
            label={ConversationsTraceI18nKey.DetailSentiment}
          />
          <InsightBadge
            field={resolution}
            className={resolutionBadgeClass(resolution?.text ?? '')}
            label={ConversationsTraceI18nKey.DetailResolutionStatus}
          />
        </div>
      )}
      <dl className="flex flex-col gap-1.5">
        <InsightTerm field={fields[ConversationsField.InsightTopic]} />
        <InsightTerm field={fields[ConversationsField.InsightTopics]} />
        <InsightTerm field={fields[ConversationsField.InsightLanguage]} />
        <InsightTerm field={fields[ConversationsField.InsightActivityType]} />
        <InsightTerm field={fields[ConversationsField.InsightActivitySubTaskType]} />
      </dl>
    </div>
  );
};

export default ConversationInsightsPanel;
