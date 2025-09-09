import { ChangeEvent, useEffect, useState } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import Triangle from '@/public/images/icons/cell-triangle.svg';
import { NO_LIMITS_ACCEPTED_USERS, NO_LIMITS_VALUE } from '@/src/components/EntityView/Roles/constants';
import { useI18n } from '@/src/locales/client';

interface EditableCellRendererParams extends ICellRendererParams {
  placeholder?: string;
  defaultValue?: number;
  inputType?: 'text' | 'number';
  valueFormatter?: (value: number | string) => string;
  onChange?: (value: number | string, data: unknown, column: string, index?: number) => void;
}

const EditableCellRenderer = ({
  value,
  placeholder,
  defaultValue,
  inputType = 'text',
  valueFormatter,
  onChange,
  setValue,
  colDef,
  data,
}: EditableCellRendererParams) => {
  const t = useI18n() as (s: string) => string;
  const translatedPlaceholder = placeholder ? t(placeholder) : '';
  const initialValue = valueFormatter ? valueFormatter(value) : value || translatedPlaceholder;
  const [inputValue, setInputValue] = useState(initialValue);

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
        value={
          inputValue == null || inputValue === NO_LIMITS_VALUE || inputValue === NO_LIMITS_ACCEPTED_USERS
            ? ''
            : inputValue
        }
        placeholder={translatedPlaceholder}
        onChange={handleChange}
        className="leading-[18px] h-[32px]"
      />
      {defaultValue !== inputValue && (
        <div className="absolute top-0 right-0 text-accent-tertiary">
          <Triangle />
        </div>
      )}
    </>
  );
};

export default EditableCellRenderer;
