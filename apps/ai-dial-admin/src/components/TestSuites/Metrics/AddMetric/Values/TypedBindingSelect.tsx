'use client';

import { ErrorText, Select, SelectOption } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { getDataTypeIcon } from './typedSelectOptions';

interface Props {
  elementId: string;
  options: SelectOption[];
  value?: string;
  placeholder: string;
  invalid?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

/**
 * Binding column select with a fixed string-type leading icon (Figma `ab`) for empty and filled states.
 * Uses Select 2.0 so option.rightControl (type tags) and interactiveTooltip render in the list.
 *
 * Padding for the overlay icon must beat Select's built-in `pl-3`. With Tailwind `important: true`,
 * a same-specificity `pl-10` loses to later `pl-3`, so we target the field with a compound selector.
 *
 * The error is rendered here, below the icon's wrapper, not through Select's `error` prop: that renders
 * inside the wrapper and would pull the vertically centered icon down with it.
 *
 * Select docks rightControl after the row button, which is the only element carrying the click and the
 * tooltip trigger. `flex-none` keeps the type tag beside the label (Figma); the button's `::after`
 * is stretched over the whole row so a click or hover anywhere on it reaches the button.
 */
const LIST_CLASS_NAME = [
  '[&_[role=none]:has(>[data-menu-item-row])]:relative',
  '[&_[data-menu-item-row]]:!flex-none',
  '[&_[data-menu-item-row]]:after:absolute',
  '[&_[data-menu-item-row]]:after:inset-0',
].join(' ');

const TypedBindingSelect: FC<Props> = ({ elementId, options, value, placeholder, invalid, error, onChange }) => {
  return (
    <div className="flex w-full flex-col gap-1">
      <div className="relative w-full [&_[aria-label=input-container]]:pl-10">
        <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-secondary" aria-hidden>
          {getDataTypeIcon('string')}
        </span>
        <Select
          id={elementId}
          options={options}
          value={value}
          placeholder={placeholder}
          invalid={invalid}
          listClassName={LIST_CLASS_NAME}
          onChange={(v) => onChange(v as string)}
        />
      </div>
      <ErrorText text={error} />
    </div>
  );
};

export default TypedBindingSelect;
