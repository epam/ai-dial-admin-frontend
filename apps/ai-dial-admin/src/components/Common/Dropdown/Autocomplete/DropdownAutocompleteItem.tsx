import { ButtonHTMLAttributes, forwardRef } from 'react';

import { useId, useListItem, useMergeRefs } from '@floating-ui/react';
import classNames from 'classnames';

export const menuItemClassNames = classNames(
  'flex w-full cursor-pointer items-center gap-3 focus-visible:border-none focus-visible:outline-none',
  'hover:bg-accent-primary-alpha pl-3 border-l-2',
);

interface Props {
  label: string;
  active: boolean;
}

const DropdownAutocompleteItem = forwardRef<HTMLButtonElement, Props & ButtonHTMLAttributes<HTMLButtonElement>>(
  function DropdownAutocompleteItem({ active, label, ...rest }, ref) {
    const id = useId();
    const item = useListItem({ label });

    return (
      <button
        ref={useMergeRefs([item.ref, ref])}
        role="option"
        id={id}
        aria-selected={active}
        {...rest}
        aria-label="dropdown-autocomplete-item"
        className={menuItemClassNames}
        style={{ ...rest.style }}
      >
        {label}
      </button>
    );
  },
);
export default DropdownAutocompleteItem;
