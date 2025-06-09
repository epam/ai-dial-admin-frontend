'use client';
import { ICellRendererParams } from 'ag-grid-community';
import React from 'react';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { useI18n } from '@/src/locales/client';
import { getItems } from './cell-renderer';
import { STRINGS_DELIMITER } from '@/src/constants/prompt';

export interface SelectCellRendererParams extends ICellRendererParams {
  isMulti?: boolean;
  items?: DropdownItemsModel[];
  getItems?: (data: unknown) => DropdownItemsModel[];
  onChange: (value: string, name: string) => void;
}

const SelectCellRenderer = (params: SelectCellRendererParams) => {
  const t = useI18n();
  const { items, allItemsCount } = getItems(params, t as (s: string) => string);

  const onChangeValue = (value: string) => {
    params.onChange(value, params.data.name);
  };

  const value = params.value?.toString();
  const selectedValue = items?.find((item) => item.id === value);
  const multipleValues = params.value?.toString().split(STRINGS_DELIMITER) as string[];

  return (
    <Dropdown
      className="w-full flex items-center"
      selectedValue={params.isMulti ? void 0 : selectedValue}
      multipleValues={params.isMulti ? multipleValues : void 0}
    >
      {items?.map((item, i) => (
        <DropdownMenuItem
          multipleValues={params.isMulti ? multipleValues : void 0}
          allItemsCount={allItemsCount}
          key={i}
          dropdownItem={item}
          onClick={() => onChangeValue(item.id)}
        />
      ))}
    </Dropdown>
  );
};

export default SelectCellRenderer;
