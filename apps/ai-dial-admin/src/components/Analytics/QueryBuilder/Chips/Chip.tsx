'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

import { IconCaretDownFilled, IconCaretUpFilled } from '@tabler/icons-react';
import classNames from 'classnames';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  prefix?: string;
  label: string;
  isOpen: boolean;
  isReadOnly?: boolean;
}

const CHIP_CLASS_NAME =
  'flex h-6 max-w-full items-center gap-1 rounded-lg border border-tertiary bg-layer-3 px-2 dial-tiny-text';

const Chip = forwardRef<HTMLButtonElement, Props>(({ prefix, label, isOpen, isReadOnly, className, ...rest }, ref) => {
  const CaretIcon = isOpen ? IconCaretUpFilled : IconCaretDownFilled;
  const text = (
    <span className="truncate text-primary">
      {prefix && <span className="text-secondary">{prefix}</span>}
      {prefix && ' '}
      {label}
    </span>
  );

  if (isReadOnly) return <span className={classNames(CHIP_CLASS_NAME, className)}>{text}</span>;

  return (
    <button
      type="button"
      {...rest}
      ref={ref}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className={classNames(
        CHIP_CLASS_NAME,
        'hover:border-secondary focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-primary',
        isOpen && 'border-secondary bg-layer-4',
        className,
      )}
    >
      {text}
      <CaretIcon size={8} className="shrink-0 text-secondary" aria-hidden />
    </button>
  );
});

Chip.displayName = 'Chip';

export default Chip;
