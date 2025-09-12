'use client';

import classNames from 'classnames';
import { FC } from 'react';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';

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
    <Tooltip tooltip={value} triggerClassName={'flex'}>
      <textarea
        id={textareaId}
        placeholder={placeholder}
        value={value == null ? '' : value}
        disabled={disabled}
        className={classNames(invalid ? 'input-error' : '', cssClass)}
        onChange={(event) => onChange?.(event.currentTarget.value)}
      />
    </Tooltip>
  );
};

export default Textarea;
