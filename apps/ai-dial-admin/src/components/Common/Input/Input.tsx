'use client';

import { ALLOWED_INPUT_KEYS } from '@/src/constants/input';
import classNames from 'classnames';
import { ChangeEvent, FC, KeyboardEvent, WheelEvent } from 'react';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';

export interface InputProps {
  type?: string;
  value?: string | number | null;
  placeholder?: string;
  inputId: string;
  cssClass?: string;
  disabled?: boolean;
  invalid?: boolean;
  hideBorder?: boolean;
  onChange?: (value: string) => void;
  min?: number;
  max?: number;
  customTooltip?: string;
}

const Input: FC<InputProps> = ({
  value = '',
  inputId,
  placeholder = '',
  cssClass = '',
  type = 'text',
  disabled,
  invalid,
  min,
  max,
  onChange,
  customTooltip,
}) => {
  const handleWheel = (e: WheelEvent<HTMLInputElement>) => (e.target as HTMLInputElement).blur();

  const isNumericInput = type === 'number' || min !== undefined || max !== undefined;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isNumericInput) return;

    if (ALLOWED_INPUT_KEYS.includes(e.key)) {
      return;
    }

    // Allow minus sign only at the beginning and if min allows negative numbers
    if (e.key === '-' && e.currentTarget.selectionStart === 0 && (min === undefined || min < 0)) {
      return;
    }

    // Allow decimal point for number inputs (but not if it already exists)
    if (e.key === '.' && type === 'number' && !e.currentTarget.value.includes('.')) {
      return;
    }

    // Only allow numeric characters
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    // Check if the resulting value would be within range
    if (min !== undefined || max !== undefined) {
      const currentValue = e.currentTarget.value;
      const cursorPosition = e.currentTarget.selectionStart || 0;
      const newValue = currentValue.slice(0, cursorPosition) + e.key + currentValue.slice(cursorPosition);
      const numericValue = parseFloat(newValue);

      if (!isNaN(numericValue)) {
        if (min !== undefined && numericValue < min) {
          e.preventDefault();
          return;
        }
        if (max !== undefined && numericValue > max) {
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.currentTarget.value;

    if (isNumericInput && newValue !== '') {
      const numericValue = parseFloat(newValue);

      // If it's not a valid number (except for partial inputs like "-" or ".")
      if (isNaN(numericValue) && newValue !== '-' && newValue !== '.') {
        return;
      }

      // Check range constraints for complete numbers
      if (!isNaN(numericValue)) {
        if (min !== undefined && numericValue < min) {
          return;
        }
        if (max !== undefined && numericValue > max) {
          return;
        }
      }
    }

    onChange?.(newValue);
  };
  return (
    <Tooltip tooltip={customTooltip || value}>
      <input
        type={type}
        autoComplete="off"
        id={inputId}
        data-testid={inputId}
        placeholder={placeholder}
        value={value as string | number}
        disabled={disabled}
        className={classNames(invalid ? 'input-error' : '', cssClass)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        min={min}
        max={max}
      />
    </Tooltip>
  );
};

export default Input;
