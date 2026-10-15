'use client';

import { Select, SelectOption } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { getDataTypeIcon } from './typedSelectOptions';

interface Props {
  elementId: string;
  options: SelectOption[];
  value?: string;
  placeholder: string;
  onChange: (value: string) => void;
}

/**
 * Binding column select with a fixed string-type leading icon (Figma `ab`) for empty and filled states.
 * Uses Select 2.0 so option.rightControl (type tags) and interactiveTooltip render in the list.
 *
 * Padding for the overlay icon must beat Select's built-in `pl-3`. With Tailwind `important: true`,
 * a same-specificity `pl-10` loses to later `pl-3`, so we target the field with a compound selector.
 */
const TypedBindingSelect: FC<Props> = ({ elementId, options, value, placeholder, onChange }) => {
  return (
    <div className="relative w-full [&_[aria-label=input-container]]:pl-10">
      <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-secondary" aria-hidden>
        {getDataTypeIcon('string')}
      </span>
      <Select
        id={elementId}
        options={options}
        value={value}
        placeholder={placeholder}
        // Select docks rightControl after a flex-1 row; flex-none keeps the type tag beside the label (Figma).
        listClassName="[&_[data-menu-item-row]]:!flex-none"
        onChange={(v) => onChange(v as string)}
      />
    </div>
  );
};

export default TypedBindingSelect;
