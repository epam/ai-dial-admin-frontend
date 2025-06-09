'use client';

import classNames from 'classnames';
import { FC } from 'react';

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
}

const Input: FC<InputProps> = ({
  value,
  inputId,
  placeholder = '',
  cssClass = '',
  type = 'text',
  disabled,
  invalid,
  onChange,
}) => {
  return (
    <input
      type={type}
      autoComplete="new-password"
      id={inputId}
      data-testid={inputId}
      placeholder={placeholder}
      value={value || ''}
      title={value ? String(value) : ''}
      disabled={disabled}
      className={classNames(invalid ? 'input-error' : '', cssClass)}
      onChange={(event) => onChange?.(event.currentTarget.value)}
    />
  );
};

export default Input;
