import { ICellRendererParams } from 'ag-grid-community';
import React, { ChangeEvent, useState } from 'react';

import { PlaceholderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import Triangle from '@/public/images/icons/cell-triangle.svg';

interface EditableCellRendererParams extends ICellRendererParams {
  placeholder?: string;
  defaultValue?: number;
  valueFormatter?: (value: number | string) => string;
  onChange?: (value: number | string, data: unknown, column: string, index?: number) => void;
}

const EditableCellRenderer = (params: EditableCellRendererParams) => {
  const t = useI18n();
  const placeholder = params.placeholder?.replace?.(' ', '');
  const translatedPlaceholder = placeholder
    ? t(PlaceholderI18nKey[placeholder as keyof typeof PlaceholderI18nKey])
    : '';
  const [value, setValue] = useState(
    params.valueFormatter ? params.valueFormatter(params.value) : params.value || placeholder,
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    if (params.valueFormatter) {
      const value = params.valueFormatter(inputValue);
      setValue(value);
      params.setValue?.(value);
    } else {
      setValue(inputValue);
      params.setValue?.(inputValue);
    }
    params.onChange?.(inputValue, params.data, params.colDef?.field as string);
  };

  return (
    <>
      <input
        id="editable-cell-renderer"
        type="text"
        value={value == null ? '' : value}
        placeholder={translatedPlaceholder}
        onChange={handleChange}
        className="leading-[18px] h-[32px]"
      />
      {params.defaultValue && params.defaultValue !== value && (
        <div className="absolute top-0 right-0 text-accent-tertiary">
          <Triangle />
        </div>
      )}
    </>
  );
};

export default EditableCellRenderer;
