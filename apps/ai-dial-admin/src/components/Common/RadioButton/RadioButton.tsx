'use client';

import classNames from 'classnames';
import { FC, useMemo } from 'react';

interface Props {
  title?: string;
  description?: string;
  checked?: boolean;
  inputId: string;
  cssClass?: string;
  labelCssClass?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

const RadioButton: FC<Props> = ({
  checked = false,
  title,
  description,
  inputId,
  labelCssClass,
  cssClass = '',
  disabled,
  onChange,
}) => {
  const labelClasses = useMemo<string>(
    () => classNames('small', 'cursor-pointer', disabled ? 'text-secondary' : 'text-primary', labelCssClass),
    [disabled, labelCssClass],
  );

  const containerClasses = classNames('flex flex-col', description && 'mb-2');

  return (
    <div className={containerClasses}>
      <div className="flex flex-row items-center">
        <input
          type="radio"
          id={inputId}
          data-testid={inputId}
          checked={checked}
          disabled={disabled}
          className={classNames(cssClass, title && 'mr-2', 'cursor-pointer')}
          onChange={() => onChange?.(title ?? '')}
        />
        {title ? (
          <label className={labelClasses} htmlFor={inputId}>
            {title}
          </label>
        ) : null}
      </div>
      {checked && description && <div className="tiny mt-2 ml-[26px]">{description}</div>}
    </div>
  );
};

export default RadioButton;
