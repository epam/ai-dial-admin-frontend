import { FC } from 'react';

import { useId } from '@floating-ui/react';
import classNames from 'classnames';

export const menuItemClassNames = classNames(
  'flex w-full cursor-pointer items-center gap-3 focus-visible:border-none focus-visible:outline-none',
  'hover:bg-accent-primary-alpha pl-3 border-l-2',
);

interface Props {
  label: string;
  active: boolean;
  onClick: (label: string) => void;
}

const DropdownAutocompleteItem: FC<Props> = ({ active, label, onClick }) => {
  const id = useId();

  return (
    <button
      role="option"
      id={id}
      onClick={() => onClick(label)}
      aria-selected={active}
      aria-label="dropdown-autocomplete-item"
      className={menuItemClassNames}
    >
      {label}
    </button>
  );
};
export default DropdownAutocompleteItem;
