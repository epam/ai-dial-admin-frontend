'use client';

import { IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  children: ReactNode;
  onRemove: () => void;
  className?: string;
  removeAriaLabel?: string;
}

const FilterChip: FC<Props> = ({ children, onRemove, className, removeAriaLabel }) => {
  const t = useI18n();

  return (
    <div className={classNames('flex text-primary small rounded bg-layer-3 px-1.5 py-1 cursor-pointer', className)}>
      <p className="flex items-center">{children}</p>
      <button
        type="button"
        aria-label={removeAriaLabel ?? t(ButtonsI18nKey.Delete)}
        className="hover:text-accent-primary ml-2"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <IconX height={16} width={16} />
      </button>
    </div>
  );
};

export default FilterChip;
