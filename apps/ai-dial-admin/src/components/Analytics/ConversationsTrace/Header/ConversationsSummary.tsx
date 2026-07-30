'use client';

import { IconThumbDownFilled } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationSummary } from '@/src/models/analytics/conversations-trace';

const ICON_SIZE = 14;

interface PillProps {
  value: ReactNode;
  label: ReactNode;
  valueClassName?: string;
  hint?: string;
}

// The hint qualifies what the number means, so it has to be reachable by keyboard rather than on hover
// alone. It goes in the pill's own content as visually-hidden text: an aria-label here would replace the
// value and label as the accessible name, announcing the caveat and hiding the figure it qualifies.
const SummaryPill: FC<PillProps> = ({ value, label, valueClassName, hint }) => (
  <div
    className="flex min-w-[92px] flex-col gap-0.5 rounded border border-primary bg-layer-3 px-3 py-2"
    role="group"
    tabIndex={0}
    title={hint}
  >
    <span className={classNames('dial-base-semi-text', valueClassName ?? 'text-primary')}>{value}</span>
    <span className="flex items-center gap-1 dial-tiny-text uppercase text-secondary">{label}</span>
    {hint && <span className="sr-only">{hint}</span>}
  </div>
);

interface Props {
  summary: ConversationSummary;
  periodLabel: string;
}

const ConversationsSummary: FC<Props> = ({ summary, periodLabel }) => {
  const t = useI18n();

  const scopeHint = summary.isTruncated
    ? t(ConversationsTraceI18nKey.SummaryTruncatedHint)
    : t(ConversationsTraceI18nKey.SummaryScopeHint);

  const conversations = summary.isTruncated ? `${summary.conversations}+` : `${summary.conversations}`;

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      <SummaryPill value={conversations} label={t(ConversationsTraceI18nKey.SummaryConversations)} hint={scopeHint} />
      <SummaryPill
        value={`${summary.rated}/${summary.conversations}`}
        label={t(ConversationsTraceI18nKey.SummaryRated)}
        valueClassName="text-success"
        hint={scopeHint}
      />
      <SummaryPill
        value={`${summary.negative}`}
        label={
          <>
            {t(ConversationsTraceI18nKey.SummaryWith)}
            <IconThumbDownFilled size={ICON_SIZE} className="text-error" aria-hidden />
          </>
        }
        valueClassName="text-error"
        hint={scopeHint}
      />
      <SummaryPill
        value={`$${summary.cost}`}
        label={`${t(ConversationsTraceI18nKey.SummaryCost)} ${periodLabel}`}
        valueClassName="text-accent-secondary"
        hint={t(ConversationsTraceI18nKey.SummaryCostHint)}
      />
    </div>
  );
};

export default ConversationsSummary;
