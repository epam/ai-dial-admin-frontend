'use client';
import { DialSelect, SelectOption } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';

import { STRINGS_DELIMITER } from '@/src/constants/prompt';
import { getItems } from './utils';

export interface SelectCellRendererParams extends ICellRendererParams {
  isMulti?: boolean;
  isReadonly?: boolean;
  items?: SelectOption[];
  getItems?: (data: unknown) => SelectOption[];
  onChange: (value: string | string[], data: unknown, column?: string, index?: number, isSelected?: boolean) => void;
}

const SelectCellRenderer = (params: SelectCellRendererParams) => {
  const { items } = getItems(params);
  const { setValue } = params;

  const onChangeValue = (value: string | string[]) => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    const displayValue = params.isMulti ? values.join(STRINGS_DELIMITER) : values[0];

    if (setValue) {
      setValue(displayValue);
    }

    params.onChange(
      value,
      params.data,
      params.colDef?.field as string,
      params.node?.rowIndex as number,
      params.node?.isSelected(),
    );
  };

  const value = params.value?.toString();
  const multipleValues = params.value === '' ? [] : (params.value?.toString().split(STRINGS_DELIMITER) as string[]);

  if (params.isReadonly) {
    return <div>{value}</div>;
  }

  return (
    <div className="h-8 w-full overflow-hidden">
      <DialSelect
        className="min-h-[32px] h-8 overflow-hidden px-2 py-1"
        options={items || []}
        selectAll={params.isMulti}
        value={params.isMulti ? multipleValues : value}
        multiple={params.isMulti}
        onChange={(value) => onChangeValue(value as string)}
      />
    </div>
  );
};

export default SelectCellRenderer;
