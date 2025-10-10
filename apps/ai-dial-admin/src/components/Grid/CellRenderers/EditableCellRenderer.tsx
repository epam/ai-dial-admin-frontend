import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { ColDef, ICellRendererParams, IRowNode } from 'ag-grid-community';

import Triangle from '@/public/images/icons/cell-triangle.svg';
import { NO_LIMITS_ACCEPTED_USERS, NO_LIMITS_VALUE } from '@/src/constants/role';
import { useI18n } from '@/src/locales/client';

interface EditableCellRendererParams extends ICellRendererParams {
  placeholder?: string;
  defaultValue?: number;
  inputType?: 'text' | 'number';
  valueFormatter?: (value: number | string) => string;
  onChange?: (value: number | string, data: unknown, column: string, index?: number) => void;
  getDefaultPlaceholder?: (node: IRowNode, colDef?: ColDef) => string;
}

const EditableCellRenderer = ({
  value,
  placeholder,
  defaultValue,
  inputType = 'text',
  valueFormatter,
  onChange,
  setValue,
  getDefaultPlaceholder,
  colDef,
  data,
  node,
}: EditableCellRendererParams) => {
  const t = useI18n() as (s: string) => string;
  const initialPlaceholder = placeholder ? t(placeholder) : '';
  const translatedPlaceholder = getDefaultPlaceholder?.(node, colDef) || initialPlaceholder;
  const initialValue = valueFormatter ? valueFormatter(value) : value || translatedPlaceholder;

  const [inputValue, setInputValue] = useState(initialValue);

  const isEmptyValue = useMemo(() => {
    return inputValue == null || inputValue === NO_LIMITS_VALUE || inputValue === NO_LIMITS_ACCEPTED_USERS;
  }, [inputValue]);

  const showTriangle = useMemo(() => {
    return getDefaultPlaceholder ? isEmptyValue : defaultValue !== inputValue;
  }, [defaultValue, getDefaultPlaceholder, inputValue, isEmptyValue]);

  const correctValue = useMemo(() => {
    return isEmptyValue ? '' : inputValue;
  }, [inputValue, isEmptyValue]);

  const correctPlaceholder = useMemo(() => {
    return inputValue === NO_LIMITS_VALUE || inputValue === NO_LIMITS_ACCEPTED_USERS
      ? initialPlaceholder
      : translatedPlaceholder;
  }, [initialPlaceholder, inputValue, translatedPlaceholder]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const formattedValue = valueFormatter ? valueFormatter(newValue) : newValue;

    setInputValue(formattedValue);

    if (onChange) {
      onChange(formattedValue, data, colDef?.field as string);
    }
    if (setValue) {
      setValue(formattedValue);
    }
  };

  useEffect(() => {
    const formattedValue = valueFormatter ? valueFormatter(value) : value || translatedPlaceholder;
    setInputValue(formattedValue);
  }, [value, valueFormatter, translatedPlaceholder]);

  return (
    <>
      <input
        id="editable-cell-renderer"
        type={inputType}
        value={correctValue}
        placeholder={correctPlaceholder}
        onChange={handleChange}
        className="leading-[18px] h-[32px]"
      />
      {showTriangle && (
        <div className="absolute top-0 right-0 text-accent-tertiary">
          <Triangle />
        </div>
      )}
    </>
  );
};

export default EditableCellRenderer;
