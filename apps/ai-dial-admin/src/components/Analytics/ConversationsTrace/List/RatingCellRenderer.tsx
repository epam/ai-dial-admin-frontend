'use client';

import { IconThumbDown, IconThumbDownFilled, IconThumbUp, IconThumbUpFilled } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';
import { FC } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

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
    <span
      className={classNames('flex items-center gap-1.5', isActive ? activeClassName : 'text-secondary')}
      aria-label={label}
    >
      <Icon size={ICON_SIZE} />
      <span className="dial-small-text">{count}</span>
    </span>
  );
};

const RatingCellRenderer: FC<ICellRendererParams<ConversationRow>> = ({ data }) => {
  const t = useI18n();

  if (!data || data.rating_up === null || data.rating_down === null) {
    return null;
  }

  return (
    <span className="flex h-full items-center gap-4">
      <RatingCount
        count={data.rating_up}
        label={t(ConversationsTraceI18nKey.RatingUp)}
        activeClassName="text-success"
        ActiveIcon={IconThumbUpFilled}
        IdleIcon={IconThumbUp}
      />
      <RatingCount
        count={data.rating_down}
        label={t(ConversationsTraceI18nKey.RatingDown)}
        activeClassName="text-error"
        ActiveIcon={IconThumbDownFilled}
        IdleIcon={IconThumbDown}
      />
    </span>
  );
};

export default RatingCellRenderer;
