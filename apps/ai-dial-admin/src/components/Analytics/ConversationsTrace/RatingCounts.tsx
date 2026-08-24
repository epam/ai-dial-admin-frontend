'use client';

import { IconThumbDown, IconThumbDownFilled, IconThumbUp, IconThumbUpFilled } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import FieldCaveat from '@/src/components/Analytics/ConversationsTrace/FieldCaveat';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationRatingCounts } from '@/src/models/analytics/conversations-trace';
import { hasNegativeRatingCaveat, negativeRatingGap } from '@/src/utils/analytics/conversation-rows';

const ICON_SIZE = 18;

interface CountProps {
  count: number;
  label: string;
  activeClassName: string;
  ActiveIcon: typeof IconThumbUp;
  IdleIcon: typeof IconThumbUp;
}

const RatingCount: FC<CountProps> = ({ count, label, activeClassName, ActiveIcon, IdleIcon }) => {
  const isActive = count > 0;
  const Icon = isActive ? ActiveIcon : IdleIcon;

  return (
    <span className={classNames('flex items-center gap-1.5', isActive ? activeClassName : 'text-secondary')}>
      <Icon size={ICON_SIZE} aria-hidden />
      <span className="sr-only">{label}</span>
      <span className="dial-small-text">{count}</span>
    </span>
  );
};

// The grid's figures are bounded to the selected period and the detail view's are the conversation's whole
// feedback, so the two legitimately disagree. The accessible name is the only thing that says which is on
// screen — one fixed string would tell a screen reader the all-time figure was period-scoped.
const LABEL_KEYS = {
  period: { up: ConversationsTraceI18nKey.RatingUp, down: ConversationsTraceI18nKey.RatingDown },
  whole: { up: ConversationsTraceI18nKey.RatingUpTotal, down: ConversationsTraceI18nKey.RatingDownTotal },
};

interface Props {
  counts: ConversationRatingCounts;
  isPeriodScoped?: boolean;
  className?: string;
}

const RatingCounts: FC<Props> = ({ counts, isPeriodScoped = false, className }) => {
  const t = useI18n();
  const labels = isPeriodScoped ? LABEL_KEYS.period : LABEL_KEYS.whole;

  return (
    <span className={classNames('flex items-center gap-4', className)}>
      <RatingCount
        count={counts.rating_up ?? 0}
        label={t(labels.up)}
        activeClassName="text-success"
        ActiveIcon={IconThumbUpFilled}
        IdleIcon={IconThumbUp}
      />
      <span className="flex items-center gap-1">
        <RatingCount
          count={counts.rating_down ?? 0}
          label={t(labels.down)}
          activeClassName="text-error"
          ActiveIcon={IconThumbDownFilled}
          IdleIcon={IconThumbDown}
        />
        {hasNegativeRatingCaveat(counts) && (
          <FieldCaveat
            caveat={t(ConversationsTraceI18nKey.RatingDownCaveat, {
              unestablished: negativeRatingGap(counts),
              down: counts.rating_down ?? 0,
              captured: counts.captured_form ?? 0,
              events: counts.rate_events ?? 0,
            })}
          />
        )}
      </span>
    </span>
  );
};

export default RatingCounts;
