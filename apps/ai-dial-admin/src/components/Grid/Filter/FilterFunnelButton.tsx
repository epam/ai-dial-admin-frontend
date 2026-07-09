'use client';

import { FC } from 'react';

import { IconFilter } from '@tabler/icons-react';
import classNames from 'classnames';

interface Props {
  isActive: boolean;
  title: string;
}

const FilterFunnelButton: FC<Props> = ({ isActive, title }) => (
  <span
    title={title}
    aria-label={title}
    className={classNames(
      'shrink-0 flex items-center justify-center size-[22px] rounded-sm cursor-pointer',
      isActive ? 'text-accent-primary bg-accent-primary-alpha' : 'text-secondary hover:text-primary',
    )}
  >
    <IconFilter size={16} />
  </span>
);

export default FilterFunnelButton;
