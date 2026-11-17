'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

import { IconCaretDownFilled, IconCaretUpFilled } from '@tabler/icons-react';
import classNames from 'classnames';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  prefix?: string;
  label: string;
  isOpen: boolean;
}

const Chip = forwardRef<HTMLButtonElement, Props>(({ prefix, label, isOpen, className, ...rest }, ref) => {
  const CaretIcon = isOpen ? IconCaretUpFilled : IconCaretDownFilled;

  return (
    <button
      type="button"
      {...rest}
      ref={ref}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className={classNames(
        'flex h-6 max-w-full items-center gap-1 rounded border border-tertiary bg-layer-3 px-2 dial-tiny-text hover:border-secondary focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-primary',
        isOpen && 'border-secondary bg-layer-4',
        className,
      )}
    >
      <span className="truncate text-primary">
        {prefix && <span className="text-secondary">{prefix}</span>}
        {prefix && ' '}
        {label}
      </span>
      <CaretIcon size={8} className="shrink-0 text-secondary" aria-hidden />
    </button>
  );
});

Chip.displayName = 'Chip';

export default Chip;
