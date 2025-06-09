'use client';

import { ChangeEvent, FC, KeyboardEvent, useCallback, useState } from 'react';
import AutocompleteInputValue from './AutocompleteInputValue';

interface Props {
  selectedItems?: string[];
  placeholder: string;
  updateSelected: (items: string[]) => void;
}

const AutocompleteInput: FC<Props> = ({ placeholder, selectedItems = [], updateSelected }) => {
  const [value, setValue] = useState('');

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        updateSelected([...selectedItems, e.currentTarget.value]);
        setValue('');
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedItems.length && !value) {
        updateSelected(selectedItems.slice(0, -1));
      }
    },
    [selectedItems, updateSelected, value],
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue],
  );

  return (
    <div className="input flex flex-row items-center flex-wrap w-fit gap-2">
      <AutocompleteInputValue selectedItems={selectedItems} />

      <input
        type="text"
        value={value}
        className="border-0 p-0"
        placeholder={selectedItems?.length ? '' : placeholder}
        onKeyDown={onKeyDown}
        onChange={onInputChange}
      />
    </div>
  );
};

export default AutocompleteInput;
