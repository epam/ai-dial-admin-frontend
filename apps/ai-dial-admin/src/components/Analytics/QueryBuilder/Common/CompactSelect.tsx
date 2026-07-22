'use client';

import { FC, useState } from 'react';

import classNames from 'classnames';
import { DialDropdown, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconChevronDown } from '@tabler/icons-react';

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  // Dimmed label rendered before the value in the trigger, naming what the value controls
  // (e.g. "Nulls:") when the options alone don't say it.
  prefix?: string;
}

// The rail's small enum picker (aggregate fn, operator, unit, direction…): a ~26px mono trigger
// with the same overlay styling as CategorizedFieldDropdown. The ui-kit select stays the choice
// for regular forms; its smallest size is still too tall for the compact builder rows.
const CompactSelect: FC<Props> = ({ options, value, onChange, ariaLabel, className, prefix }) => {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  const onPick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <DialDropdown
      open={open}
      onOpenChange={setOpen}
      placement="bottom-start"
      renderOverlay={() => (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="max-h-[240px] min-w-[112px] overflow-y-auto rounded border border-secondary bg-layer-0 p-1 shadow-lg"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={classNames(
                'flex w-full items-center rounded px-2 py-1.5 text-left font-mono dial-tiny-text text-primary hover:bg-layer-4',
                option.value === value && 'bg-accent-primary-alpha',
              )}
              onClick={() => onPick(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        className={classNames(
          'flex h-[26px] w-full items-center justify-between gap-1 rounded border border-primary bg-layer-2 px-2 font-mono dial-tiny-text text-primary hover:bg-layer-4',
          className,
        )}
      >
        <span className="truncate">
          {prefix && <span className="text-secondary">{prefix} </span>}
          {selected?.label ?? value}
        </span>
        <IconChevronDown size={12} className="shrink-0 text-secondary" />
      </button>
    </DialDropdown>
  );
};

export default CompactSelect;
