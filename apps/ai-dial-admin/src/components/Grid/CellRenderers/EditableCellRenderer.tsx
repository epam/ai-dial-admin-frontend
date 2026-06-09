import { ChangeEvent, ComponentProps, KeyboardEvent, useEffect, useMemo, useState } from 'react';

import { ColDef, ICellRendererParams, IRowNode } from 'ag-grid-community';
import classNames from 'classnames';

import Triangle from '@/public/images/icons/cell-triangle.svg';
import { RolesI18nKey } from '@/src/constants/i18n';
import { UNLIMITED_ACCEPTED_USERS, UNLIMITED_VALUE } from '@/src/constants/role';
import { useI18n } from '@/src/locales/client';
import { formatEditableValue } from './utils';

interface EditableCellRendererParams extends ICellRendererParams {
  placeholder?: string;
  defaultValue?: number;
  inputType?: 'text' | 'number';
  inputMode?: ComponentProps<'input'>['inputMode'];
  hideTriangle?: boolean;
  skipRequired?: boolean;
  required?: boolean;
  valueFormatter?: (value: number | string) => string;
  onChange?: (value: number | string, data: unknown, column: string, index?: number) => void;
  getDefaultPlaceholder?: (node: IRowNode, colDef?: ColDef) => string;
  showMaxValue?: boolean;
  isReadonly?: boolean;
  step?: string | number;
  min?: string | number;
  max?: string | number;
}

const EditableCellRenderer = ({
  value,
  placeholder,
  defaultValue,
  inputType = 'text',
  inputMode,
  hideTriangle,
  skipRequired,
  required,
  valueFormatter,
  onChange,
  setValue,
  getDefaultPlaceholder,
  colDef,
  data,
  node,
  showMaxValue,
  isReadonly,
  step,
  min,
  max,
}: EditableCellRendererParams) => {
  const t = useI18n();
  const initialPlaceholder = placeholder ? t(placeholder) : '';
  const translatedPlaceholder = getDefaultPlaceholder?.(node, colDef) || initialPlaceholder;
  const initialValue = formatEditableValue(value, valueFormatter, translatedPlaceholder);

  const [inputValue, setInputValue] = useState(initialValue);

  const isMaxValue = useMemo(() => {
    return inputValue === UNLIMITED_VALUE || inputValue === UNLIMITED_ACCEPTED_USERS || showMaxValue;
  }, [inputValue, showMaxValue]);

  const correctValue = useMemo(() => {
    return (inputValue ?? '') === '' || isMaxValue ? '' : inputValue;
  }, [inputValue, isMaxValue]);

  const showTriangle = useMemo(() => {
    const value = !correctValue || isMaxValue ? void 0 : correctValue;
    return getDefaultPlaceholder ? value : defaultValue != value;
  }, [defaultValue, getDefaultPlaceholder, correctValue, isMaxValue]);

  const correctPlaceholder = useMemo(() => {
    return isMaxValue ? t(RolesI18nKey.Unlimited) : translatedPlaceholder;
  }, [isMaxValue, t, translatedPlaceholder]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      if ((e.key === 'a' || e.key === 'A') && e.currentTarget.value.length > 0) {
        e.currentTarget.select();
      }
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const formattedValue = valueFormatter ? valueFormatter(newValue) : newValue;
    if (formattedValue === undefined) {
      return;
    }

    setInputValue(formattedValue);

    if (onChange) {
      onChange(formattedValue, data, colDef?.field as string, node?.rowIndex as number);
    }
    if (setValue) {
      setValue(formattedValue);
    }
  };

  useEffect(() => {
    const formattedValue = formatEditableValue(value, valueFormatter, translatedPlaceholder);
    setInputValue(formattedValue);
  }, [value, valueFormatter, translatedPlaceholder]);

  if (isReadonly) {
    return <div>{correctValue}</div>;
  }

  return (
    <>
      <input
        id="editable-cell-renderer"
        type={inputType}
        inputMode={inputMode}
        value={correctValue}
        placeholder={correctPlaceholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        step={step}
        min={min}
        max={max}
        className={classNames(
          'leading-[18px] h-[32px] dial-input px-2 py-1',
          !skipRequired && data.required && (correctValue == null || correctValue === '') && 'dial-input-error',
          required && (correctValue == null || correctValue === '') && 'dial-input-error',
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
