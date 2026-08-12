'use client';

import { IconThumbDownFilled } from '@tabler/icons-react';
import { Big } from 'big.js';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import { SUMMARY_COST_PRECISION } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationSummary, ConversationTotals } from '@/src/models/analytics/conversations-trace';
import { toBig, toNumber } from '@/src/utils/analytics/scalar';

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
  totals: ConversationTotals | null;
  summary: ConversationSummary;
  loadedCount: number;
  periodLabel: string;
}

const UNAVAILABLE = '—';

const ConversationsSummary: FC<Props> = ({ totals, summary, loadedCount, periodLabel }) => {
  const t = useI18n();

  // The count and the cost are whole-result figures from their own query; the rated and negative counts
  // cover only the rows loaded so far, so each pill states the scope it actually reports.
  const resultHint = t(ConversationsTraceI18nKey.SummaryResultHint);
  const loadedHint = t(ConversationsTraceI18nKey.SummaryLoadedHint);
  const unavailableHint = t(ConversationsTraceI18nKey.SummaryUnavailableHint);

  const conversationCount = totals ? toNumber(totals.conversations) : null;
  // A sum over an empty result is null, which means zero — not unavailable. Only an absent `totals`
  // (the request failed) may render as unavailable.
  const cost = totals ? (toBig(totals.cost) ?? new Big(0)) : null;

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      <SummaryPill
        value={conversationCount === null ? UNAVAILABLE : `${conversationCount}`}
        label={t(ConversationsTraceI18nKey.SummaryConversations)}
        hint={conversationCount === null ? unavailableHint : resultHint}
      />
      <SummaryPill
        value={`${summary.rated}/${loadedCount}`}
        label={t(ConversationsTraceI18nKey.SummaryRated)}
        valueClassName="text-success"
        hint={loadedHint}
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
        hint={loadedHint}
      />
      <SummaryPill
        value={cost === null ? UNAVAILABLE : `$${cost.round(SUMMARY_COST_PRECISION).toString()}`}
        label={`${t(ConversationsTraceI18nKey.SummaryCost)} ${periodLabel}`}
        valueClassName="text-accent-secondary"
        hint={cost === null ? unavailableHint : resultHint}
      />
    </div>
  );
};

export default ConversationsSummary;
