'use client';

import { DialEllipsisTooltip, DialTooltip } from '@epam/ai-dial-ui-kit';
import { FC, Fragment, ReactNode } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationDetailRow, ConversationsField } from '@/src/models/analytics/conversations-trace';
import { conversationTitle } from '@/src/utils/analytics/conversation-detail-fields';
import {
  formatCompactNumber,
  formatConversationSpan,
  formatRelativeTime,
} from '@/src/utils/analytics/conversation-formatting';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface MetaProps {
  label: string;
  value: ReactNode;
  hint?: string;
  title?: string;
  action?: ReactNode;
}

const MetaTag: FC<MetaProps> = ({ label, value, hint, title, action }) => {
  const text = (
    <span className="inline-flex min-w-0 items-center gap-1.5 font-mono dial-small-text text-secondary">
      {label}
      <span className="min-w-0 text-primary dial-small-semi-text" title={title}>
        {value}
      </span>
      {action}
    </span>
  );

  return hint ? <DialTooltip tooltip={hint}>{text}</DialTooltip> : text;
};

const Separator: FC = () => <span aria-hidden className="h-4 w-px bg-tertiary" />;

interface Props {
  conversation: ConversationDetailRow;
  nowMs: number;
}

const ConversationDetailHeader: FC<Props> = ({ conversation, nowMs }) => {
  const t = useI18n();

  const project = conversation.project_id?.trim() ? conversation.project_id : t(ConversationsTraceI18nKey.NoProject);

  // The metadata panel states the deployments; restating them here would present one fact twice, which is
  // what the turn count and the rating counts are already kept out of the header for.
  const meta: MetaProps[] = [
    {
      label: t(ConversationsTraceI18nKey.DetailId),
      value: (
        <span className="inline-block max-w-[260px] align-bottom">
          <DialEllipsisTooltip text={conversation.chat_id} />
        </span>
      ),
      action: (
        <CopyButton
          value={conversation.chat_id}
          valueLabel={t(ConversationsTraceI18nKey.Conversation)}
          className="shrink-0"
        />
      ),
    },
    { label: t(ConversationsTraceI18nKey.Project), value: project },
    {
      label: t(ConversationsTraceI18nKey.DetailTurns),
      value: formatCompactNumber(conversation.turn_count) || UNAVAILABLE_VALUE,
    },
    {
      label: t(ConversationsTraceI18nKey.DetailDuration),
      value:
        formatConversationSpan(conversation.first_request_time, conversation.last_request_time) || UNAVAILABLE_VALUE,
    },
    {
      label: t(ConversationsTraceI18nKey.DetailLastActivity),
      value: formatRelativeTime(conversation.last_request_time, nowMs) || UNAVAILABLE_VALUE,
      title: formatDateTimeToLocalString(conversation.last_request_time ?? undefined),
    },
  ];

  const title = conversationTitle(conversation);
  // The evaluator assembles a conversation's bodies up to a size cap and flags what it had to cut, so a
  // title on a long conversation can describe only the part that was read. The log says this once for the
  // column; here there is one conversation and room to say what it means for it.
  const isTitleTruncated = Boolean(title && conversation[ConversationsField.InsightTruncated]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {/* The heading names the conversation and the id identifies it. An untitled conversation still needs
          an accessible heading, so the dash carries the label rather than standing alone as the name. */}
      <h1 className="min-w-0 text-primary">
        {title ? (
          <DialEllipsisTooltip text={title} />
        ) : (
          <span aria-label={t(ConversationsTraceI18nKey.NoTitle)}>{UNAVAILABLE_VALUE}</span>
        )}
      </h1>
      {isTitleTruncated && (
        <p className="text-secondary dial-tiny-text">{t(ConversationsTraceI18nKey.DetailTitleTruncated)}</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {meta.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <Separator />}
            <MetaTag {...item} />
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default ConversationDetailHeader;
