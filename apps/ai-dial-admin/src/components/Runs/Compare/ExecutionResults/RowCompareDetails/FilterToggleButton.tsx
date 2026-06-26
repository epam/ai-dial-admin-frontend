'use client';

import { FC } from 'react';

import { IconFilter } from '@tabler/icons-react';
import classNames from 'classnames';

interface Props {
  isActive: boolean;
  onClick: () => void;
}

const FilterToggleButton: FC<Props> = ({ isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={classNames(
      'shrink-0 flex items-center justify-center size-[22px] rounded-sm',
      isActive ? 'text-accent-primary bg-accent-primary-alpha' : 'text-secondary hover:text-primary',
    )}
    aria-pressed={isActive}
  >
    <IconFilter size={16} />
  </button>
);

export default FilterToggleButton;
