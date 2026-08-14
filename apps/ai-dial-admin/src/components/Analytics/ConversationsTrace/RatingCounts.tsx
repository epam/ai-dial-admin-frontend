'use client';

import { IconThumbDown, IconThumbDownFilled, IconThumbUp, IconThumbUpFilled } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

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

interface Props {
  ratingUp: number;
  ratingDown: number;
  className?: string;
}

const RatingCounts: FC<Props> = ({ ratingUp, ratingDown, className }) => {
  const t = useI18n();

  return (
    <span className={classNames('flex items-center gap-4', className)}>
      <RatingCount
        count={ratingUp}
        label={t(ConversationsTraceI18nKey.RatingUp)}
        activeClassName="text-success"
        ActiveIcon={IconThumbUpFilled}
        IdleIcon={IconThumbUp}
      />
      <RatingCount
        count={ratingDown}
        label={t(ConversationsTraceI18nKey.RatingDown)}
        activeClassName="text-error"
        ActiveIcon={IconThumbDownFilled}
        IdleIcon={IconThumbDown}
      />
    </span>
  );
};

export default RatingCounts;
