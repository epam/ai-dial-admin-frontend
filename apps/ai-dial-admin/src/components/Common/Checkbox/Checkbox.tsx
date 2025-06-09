'use client';

import classNames from 'classnames';
import { ChangeEvent, FC, useCallback } from 'react';
import CheckboxFilled from '@/public/images/icons/checkbox-filled.svg';

interface Props {
  id: string;
  label?: string;
  checked: boolean;
  onChange?: (value?: boolean, id?: string) => void;
}

const Checkbox: FC<Props> = ({ label, id, checked, onChange }) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onChange?.(e.target.checked, id);
    },
    [onChange, id],
  );

  const checkboxClassNames = classNames(
    'flex flex-row items-center cursor-pointer text-accent-primary small-medium',
    `${checked ? '' : 'before:content-[""] before:inline-block before:w-[18px] before:h-[18px] before:border before:border-hover before:rounded before:mr-2'}`,
  );

  return (
    <label className={checkboxClassNames} htmlFor={id}>
      {checked && <CheckboxFilled className="mr-2" />}
      {label && <p className="text-primary">{label}</p>}
      <input type="checkbox" onChange={handleChange} id={id} checked={checked} className="invisible w-0 h-0" />
    </label>
  );
};

export default Checkbox;
