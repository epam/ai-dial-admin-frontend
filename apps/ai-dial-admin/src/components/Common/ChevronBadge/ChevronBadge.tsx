import { IconChevronsDown, IconChevronsUp } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

interface Props {
  isPositive: boolean;
  size?: number;
}

export const ChevronBadge: FC<Props> = ({ isPositive, size = 16 }) => {
  return (
    <span
      className={classNames(
        'flex size-5 shrink-0 items-center justify-center rounded',
        isPositive ? 'bg-score-abs-11' : 'bg-score-abs-00',
      )}
      aria-hidden
    >
      {isPositive ? (
        <IconChevronsUp size={size} className="text-score-abs-11" />
      ) : (
        <IconChevronsDown size={size} className="text-score-abs-00" />
      )}
    </span>
  );
};
