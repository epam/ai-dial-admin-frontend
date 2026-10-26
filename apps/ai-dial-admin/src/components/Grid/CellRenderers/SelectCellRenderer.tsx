'use client';
import { Select, SelectOption } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';

import { STRINGS_DELIMITER } from '@/src/constants/prompt';
import { getItems } from './utils';
import { ReactNode, MouseEvent, useEffect, useState } from 'react';

export interface SelectCellRendererParams extends ICellRendererParams {
  isMulti?: boolean;
  isReadonly?: boolean;
  items?: SelectOption[];
  getItems?: (data: unknown) => SelectOption[];
  onChange: (value: string | string[], data: unknown, column?: string, index?: number, isSelected?: boolean) => void;
  customMultiSelectTagsRenderer?: (
    options: SelectOption[],
    selectedValues: string[],
    handleRemoveTag: (event: MouseEvent<HTMLButtonElement>, val: string) => void,
  ) => ReactNode;
}

const SelectCellRenderer = (params: SelectCellRendererParams) => {
  const { items } = getItems(params);
  const { setValue } = params;
  const incomingValue = params.value?.toString();
  const [localValue, setLocalValue] = useState(incomingValue);

  useEffect(() => {
    setLocalValue(incomingValue);
  }, [incomingValue, params.data]);

  const onChangeValue = (value: string | string[]) => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    const displayValue = params.isMulti ? values.join(STRINGS_DELIMITER) : values[0];
    setLocalValue(displayValue);

    params.onChange(
      value,
      params.data,
      params.colDef?.field as string,
      params.node?.rowIndex as number,
      params.node?.isSelected(),
    );

    if (setValue) {
      setValue(displayValue);
    }
  };

  const multipleValues = localValue === '' || localValue == null ? [] : localValue.split(STRINGS_DELIMITER);

  if (params.isReadonly) {
    return <div>{localValue}</div>;
  }

  return (
    <div className="h-8 w-full overflow-hidden">
      <Select
        options={items || []}
        selectAll={params.isMulti}
        value={params.isMulti ? multipleValues : localValue}
        multiple={params.isMulti}
        onChange={(value) => onChangeValue(value as string)}
        customMultiSelectTagsRenderer={params.customMultiSelectTagsRenderer}
        fieldClassName="h-8 py-0"
      />
    </div>
  );
};

export default SelectCellRenderer;
