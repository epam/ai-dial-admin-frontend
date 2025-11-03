'use client';
import { DialSelect, SelectOption } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';

import { STRINGS_DELIMITER } from '@/src/constants/prompt';
import { useI18n } from '@/src/locales/client';
import { getItems } from './utils';

export interface SelectCellRendererParams extends ICellRendererParams {
  isMulti?: boolean;
  items?: SelectOption[];
  getItems?: (data: unknown) => SelectOption[];
  onChange: (value: string, data: unknown, column?: string, index?: number) => void;
}

const SelectCellRenderer = (params: SelectCellRendererParams) => {
  const t = useI18n();
  const { items } = getItems(params, t as (s: string) => string);

  const onChangeValue = (value: string) => {
    params.onChange(value, params.data, params.colDef?.field as string, params.node.rowIndex as number);
  };

  const value = params.value?.toString();
  const multipleValues = params.value?.toString().split(STRINGS_DELIMITER) as string[];

  return (
    <div className="h-8 w-full">
      <DialSelect
        options={items || []}
        value={params.isMulti ? multipleValues : value}
        multiple={params.isMulti}
        onChange={(value) => onChangeValue(value as string)}
      />
    </div>
  );
};

export default SelectCellRenderer;
