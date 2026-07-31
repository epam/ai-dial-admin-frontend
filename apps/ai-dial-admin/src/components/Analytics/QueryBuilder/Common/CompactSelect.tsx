'use client';

import { FC, useState } from 'react';

import classNames from 'classnames';
import { DialDropdown, DialEllipsisTooltip, DialTooltip, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';

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
// Options say what each value means in words — the full `label`, in both the list and the trigger,
// with `description` as the option's hover tooltip.
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
          className="max-h-[240px] min-w-[224px] overflow-y-auto rounded border border-secondary bg-layer-0 p-1 shadow-lg"
        >
          {options.map((option) => (
            <DialTooltip
              key={option.value}
              hideTooltip={!option.description}
              tooltip={option.description}
              triggerClassName="w-full"
              contentClassName="max-w-[320px]"
            >
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                // A reserved leading slot keeps the labels aligned whether or not a check shows.
                className={classNames(
                  'flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left font-mono dial-tiny-text text-primary hover:bg-layer-4',
                  option.value === value && 'bg-accent-primary-alpha hover:bg-accent-primary-alpha',
                )}
                onClick={() => onPick(option.value)}
              >
                <span className="w-3 shrink-0">
                  {option.value === value && <IconCheck aria-hidden size={12} className="text-accent-primary" />}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            </DialTooltip>
          ))}
        </div>
      )}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={classNames(
          'flex h-[26px] w-full items-center justify-between gap-1 rounded border border-primary bg-layer-2 px-2 font-mono dial-tiny-text text-primary hover:bg-layer-4',
          className,
        )}
      >
        {/* Full names outgrow these compact triggers, so a truncated label keeps its tooltip. */}
        <DialEllipsisTooltip
          className="min-w-0 flex-1 text-left"
          text={
            <>
              {prefix && <span className="text-secondary">{prefix} </span>}
              {selected?.label ?? value}
            </>
          }
        />
        <IconChevronDown size={12} className="shrink-0 text-secondary" />
      </button>
    </DialDropdown>
  );
};

export default CompactSelect;
