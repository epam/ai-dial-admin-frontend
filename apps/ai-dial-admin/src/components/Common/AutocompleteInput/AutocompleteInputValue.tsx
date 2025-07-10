'use client';

import { FC } from 'react';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';

interface Props {
  selectedItems?: string[];
}

const AutocompleteInputValue: FC<Props> = ({ selectedItems }) => {
  return (
    <ul className="flex flex-row items-center gap-x-2 gap-y-1 truncate flex-wrap">
      {selectedItems?.map((selectedItem) => (
        <li key={selectedItem} className="tiny bg-layer-3 rounded p-1 border border-primary max-w-[200px] truncate">
          <Tooltip triggerClassName="flex-1 min-w-0" contentClassName="truncate" tooltip={selectedItem}>
            <button aria-label="autocomplete-action" type="button" className="truncate w-full">
              {selectedItem}
            </button>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
};

export default AutocompleteInputValue;
