import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { ColDef, ICellRendererParams, IRowNode } from 'ag-grid-community';
import classNames from 'classnames';

import Triangle from '@/public/images/icons/cell-triangle.svg';
import { RolesI18nKey } from '@/src/constants/i18n';
import { UNLIMITED_ACCEPTED_USERS, UNLIMITED_VALUE } from '@/src/constants/role';
import { useI18n } from '@/src/locales/client';

interface EditableCellRendererParams extends ICellRendererParams {
  placeholder?: string;
  defaultValue?: number;
  inputType?: 'text' | 'number';
  hideTriangle?: boolean;
  skipRequired?: boolean;
  valueFormatter?: (value: number | string) => string;
  onChange?: (value: number | string, data: unknown, column: string, index?: number) => void;
  getDefaultPlaceholder?: (node: IRowNode, colDef?: ColDef) => string;
  showMaxValue?: boolean;
}

const EditableCellRenderer = ({
  value,
  placeholder,
  defaultValue,
  inputType = 'text',
  hideTriangle,
  skipRequired,
  valueFormatter,
  onChange,
  setValue,
  getDefaultPlaceholder,
  colDef,
  data,
  node,
  showMaxValue,
}: EditableCellRendererParams) => {
  const t = useI18n();
  const initialPlaceholder = placeholder ? t(placeholder) : '';
  const translatedPlaceholder = getDefaultPlaceholder?.(node, colDef) || initialPlaceholder;
  const initialValue = valueFormatter ? valueFormatter(value) : value || translatedPlaceholder;

  const [inputValue, setInputValue] = useState(initialValue);

  const isMaxValue = useMemo(() => {
    return inputValue === UNLIMITED_VALUE || inputValue === UNLIMITED_ACCEPTED_USERS || showMaxValue;
  }, [inputValue, showMaxValue]);

  const correctValue = useMemo(() => {
    return !inputValue || isMaxValue ? '' : inputValue;
  }, [inputValue, isMaxValue]);

  const showTriangle = useMemo(() => {
    const value = !correctValue || isMaxValue ? void 0 : correctValue;
    return getDefaultPlaceholder ? value : defaultValue != value;
  }, [defaultValue, getDefaultPlaceholder, correctValue, isMaxValue]);

  const correctPlaceholder = useMemo(() => {
    return isMaxValue ? t(RolesI18nKey.Unlimited) : translatedPlaceholder;
  }, [isMaxValue, t, translatedPlaceholder]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const formattedValue = valueFormatter ? valueFormatter(newValue) : newValue;

    setInputValue(formattedValue);

    if (onChange) {
      onChange(formattedValue, data, colDef?.field as string, node?.rowIndex as number);
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
        className={classNames(
          'leading-[18px] h-[32px] dial-input px-2 py-1',
          !skipRequired && data.required && !correctValue && 'dial-input-error',
          isMaxValue && 'placeholder-primary',
        )}
      />
      {showTriangle && !hideTriangle && (
        <div className="absolute top-0 right-0 text-accent-tertiary">
          <Triangle />
        </div>
      )}
    </>
  );
};

export default EditableCellRenderer;
