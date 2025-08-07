'use client';

import classNames from 'classnames';
import { FC } from 'react';

interface Props {
  value?: string | number | null;
  placeholder?: string;
  textareaId: string;
  cssClass?: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
}

const Textarea: FC<Props> = ({ value, textareaId, placeholder, cssClass = '', disabled, invalid, onChange }) => {
  return (
    <textarea
      id={textareaId}
      data-testid={textareaId}
      placeholder={placeholder}
      value={value || void 0}
      disabled={disabled}
      className={classNames(invalid ? 'input-error' : '', cssClass)}
      onChange={(event) => onChange?.(event.currentTarget.value)}
    />
  );
};

export default Textarea;
