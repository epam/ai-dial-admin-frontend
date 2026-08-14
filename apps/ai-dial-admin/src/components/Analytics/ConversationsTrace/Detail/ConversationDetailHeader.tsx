'use client';

import { DialEllipsisTooltip, DialTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, Fragment } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { PROVENANCE_MARKER_CLASS, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ColumnProvenance, ConversationDetailRow } from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatConversationSpan,
  formatRelativeTime,
} from '@/src/utils/analytics/conversation-formatting';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface MetaProps {
  label: string;
  value: string;
  hint?: string;
  title?: string;
  markerClassName?: string;
}

const MetaTag: FC<MetaProps> = ({ label, value, hint, title, markerClassName }) => {
  const text = (
    <span className="inline-flex items-center gap-1.5 font-mono dial-small-text text-secondary">
      {markerClassName && <span aria-hidden className={classNames('size-2 rounded-full', markerClassName)} />}
      {label}
      <span className="text-primary dial-small-semi-text" title={title}>
        {value}
      </span>
    </span>
  );

  return hint ? <DialTooltip tooltip={hint}>{text}</DialTooltip> : text;
};

const Separator: FC = () => <span aria-hidden className="h-4 w-px bg-tertiary" />;

interface Props {
  conversation: ConversationDetailRow;
  nowMs: number;
  turnCount: number;
}

const ConversationDetailHeader: FC<Props> = ({ conversation, nowMs, turnCount }) => {
  const t = useI18n();

  const project = conversation.project_id?.trim() ? conversation.project_id : t(ConversationsTraceI18nKey.NoProject);

  const meta: MetaProps[] = [
    {
      label: t(ConversationsTraceI18nKey.DetailTitleField),
      value: UNAVAILABLE_VALUE,
      markerClassName: PROVENANCE_MARKER_CLASS[ColumnProvenance.None],
    },
    { label: t(ConversationsTraceI18nKey.Project), value: project },
    {
      label: t(ConversationsTraceI18nKey.DetailModel),
      value: UNAVAILABLE_VALUE,
      markerClassName: PROVENANCE_MARKER_CLASS[ColumnProvenance.None],
    },
    { label: t(ConversationsTraceI18nKey.DetailTurns), value: String(turnCount) },
    {
      label: t(ConversationsTraceI18nKey.DetailRequests),
      value: formatCompactNumber(conversation.turn_count) || UNAVAILABLE_VALUE,
      hint: t(ConversationsTraceI18nKey.DetailRequestsHint),
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

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="min-w-0 max-w-[300px] text-primary">
          <DialEllipsisTooltip text={conversation.chat_id} className="font-mono" />
        </h1>
        <CopyButton
          value={conversation.chat_id}
          valueLabel={t(ConversationsTraceI18nKey.Conversation)}
          className="shrink-0"
        />
      </div>
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
