'use client';

import { FC, ReactNode } from 'react';
import classNames from 'classnames';

import Input, { InputProps } from './Input';

interface Props extends InputProps {
  iconAfterInput?: ReactNode;
  iconBeforeInput?: ReactNode;
}

const InputWithIcon: FC<Props> = ({ iconBeforeInput, iconAfterInput, hideBorder, cssClass, ...props }) => {
  if (!iconBeforeInput && !iconAfterInput) {
    return <Input cssClass={classNames(cssClass)} {...props} />;
  }

  return (
    <div
      className={classNames(
        'input-field flex flex-row items-center p-0',
        hideBorder ? 'w-full' : 'input',
        iconAfterInput ? 'pr-2' : '',
        iconBeforeInput ? 'pl-2' : '',
        props.disabled ? 'bg-layer-3 text-secondary' : '',
      )}
    >
      {iconBeforeInput}
      <Input cssClass={classNames('border-0 bg-transparent', cssClass)} {...props} />
      {iconAfterInput}
    </div>
  );
};
export default InputWithIcon;
