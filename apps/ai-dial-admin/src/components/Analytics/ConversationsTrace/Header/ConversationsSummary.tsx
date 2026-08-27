'use client';

import { IconThumbDownFilled } from '@tabler/icons-react';
import { Big } from 'big.js';
import classNames from 'classnames';
import { FC, ReactNode, useId } from 'react';

import { SUMMARY_COST_PRECISION, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationPeriodSummary } from '@/src/models/analytics/conversations-trace';
import { toBig, toNumber } from '@/src/utils/analytics/scalar';

const ICON_SIZE = 14;

interface PillProps {
  value: ReactNode;
  label: ReactNode;
  valueClassName?: string;
  hint?: string;
  scope?: string;
}

// The hint qualifies what the number means, so it has to be reachable by keyboard rather than on hover
// alone — but it is a description, not a name. `role="group"` takes no name from its content, so a bare
// `title` would make the caveat the group's whole accessible name and hide the figure it qualifies, while
// a `title` plus the same string in the content reads it out twice. Naming the group from the figure and
// describing it with the hint announces each exactly once; `title` stays for the pointer.
const SummaryPill: FC<PillProps> = ({ value, label, valueClassName, hint, scope }) => {
  const id = useId();
  const figureId = `${id}-figure`;
  const hintId = `${id}-hint`;

  return (
    <div
      className="flex min-w-[92px] flex-col gap-0.5 rounded border border-primary bg-layer-3 px-3 py-2"
      role="group"
      tabIndex={0}
      title={hint}
      aria-labelledby={figureId}
      {...(hint ? { 'aria-describedby': hintId } : {})}
    >
      <span id={figureId} className="flex flex-col gap-0.5">
        <span className={classNames('dial-base-semi-text', valueClassName ?? 'text-primary')}>{value}</span>
        {/* The period sits on the label's row: stacked, it read as a second fact rather than the scope. */}
        <span className="flex items-center gap-1 dial-tiny-text text-secondary">
          {label}
          {scope && <span>{scope}</span>}
        </span>
      </span>
      {hint && (
        <span id={hintId} className="sr-only">
          {hint}
        </span>
      )}
    </div>
  );
};

interface Props {
  period: ConversationPeriodSummary | null;
  periodLabel: string;
  isPending?: boolean;
}

const ConversationsSummary: FC<Props> = ({ period, periodLabel, isPending = false }) => {
  const t = useI18n();

  // No pill tracks the grid's filters, so each states on its face the period it covers.
  const periodHint = t(ConversationsTraceI18nKey.SummaryPeriodHint);
  // A figure not resolved yet renders as a dash exactly like one that failed, so only the hint can tell the
  // two apart — and announcing "could not be loaded" over a request still in flight reports a failure that
  // has not happened.
  const absentHint = t(
    isPending ? ConversationsTraceI18nKey.SummaryPendingHint : ConversationsTraceI18nKey.SummaryUnavailableHint,
  );

  const totals = period?.totals;
  const ratings = period?.ratings;

  const conversationCount = totals ? toNumber(totals.conversations) : null;
  // A sum over an empty period is null, which means zero — not unavailable. Only an absent aggregate
  // (the request failed) may render as unavailable.
  const cost = totals ? (toBig(totals.cost) ?? new Big(0)) : null;
  const rated = ratings ? (toNumber(ratings.rated) ?? 0) : null;
  const negative = ratings ? (toNumber(ratings.negative) ?? 0) : null;

  // A bare count, not a ratio over the conversation pill. The two would be bounded by different clocks —
  // ratings by when they were submitted, conversations by when they were last active — so a conversation
  // rated inside the period whose activity fell outside it counts toward one and not the other. Rendered as
  // a ratio that reads above one, which is not a proportion and looks like a defect.
  const isRatedUnavailable = rated === null;

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      <SummaryPill
        value={conversationCount === null ? UNAVAILABLE_VALUE : `${conversationCount}`}
        label={t(ConversationsTraceI18nKey.SummaryConversations)}
        hint={conversationCount === null ? absentHint : periodHint}
        scope={periodLabel}
      />
      <SummaryPill
        value={isRatedUnavailable ? UNAVAILABLE_VALUE : `${rated}`}
        label={t(ConversationsTraceI18nKey.SummaryRated)}
        valueClassName="text-success"
        hint={isRatedUnavailable ? absentHint : periodHint}
        scope={periodLabel}
      />
      <SummaryPill
        value={negative === null ? UNAVAILABLE_VALUE : `${negative}`}
        label={
          <>
            {t(ConversationsTraceI18nKey.SummaryWith)}
            <IconThumbDownFilled size={ICON_SIZE} className="text-error" aria-hidden />
          </>
        }
        valueClassName="text-error"
        hint={negative === null ? absentHint : periodHint}
        scope={periodLabel}
      />
      <SummaryPill
        value={cost === null ? UNAVAILABLE_VALUE : `$${cost.round(SUMMARY_COST_PRECISION).toString()}`}
        label={t(ConversationsTraceI18nKey.SummaryCost)}
        valueClassName="text-accent-secondary"
        hint={cost === null ? absentHint : periodHint}
        scope={periodLabel}
      />
    </div>
  );
};

export default ConversationsSummary;
