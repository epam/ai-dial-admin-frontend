'use client';

import classNames from 'classnames';

import { SegmentedControlOption } from '@/src/components/Common/SegmentedControl/models';

interface Props<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

const SEGMENT_BASE =
  'flex flex-1 items-center justify-center gap-2 h-7 px-3 py-1 border border-primary dial-small-text';

function SegmentedControl<T extends string>({ options, value, onChange, className, ariaLabel }: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={classNames('flex items-center rounded bg-layer-3', className)}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={classNames(
              SEGMENT_BASE,
              !isLast && '-mr-px',
              isFirst && 'rounded-l',
              isLast && 'rounded-r',
              isSelected
                ? 'relative z-10 bg-controls-accent-primary-alpha-active text-primary'
                : 'text-secondary hover:text-primary',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
