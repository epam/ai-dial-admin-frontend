'use client';

import { FC } from 'react';
import classNames from 'classnames';

import Input, { InputProps } from './Input';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';

interface Props extends InputProps {
  textBeforeInput?: string;
}

const InputWithText: FC<Props> = ({ textBeforeInput, cssClass, ...props }) => {
  if (!textBeforeInput) {
    return <Input cssClass={classNames(cssClass)} {...props} />;
  }

  return (
    <div
      className={classNames(
        'input-field items-center flex flex-row p-0 input',
        props.disabled ? 'bg-layer-3 text-secondary' : '',
      )}
    >
      <p className="overflow-hidden overflow-ellipsis items-center px-4 py-3 bg-layer-3 small text-secondary">
        <Tooltip tooltip={textBeforeInput}>{textBeforeInput}</Tooltip>
      </p>
      <Input cssClass={classNames('border-0 bg-transparent', cssClass)} {...props} />
    </div>
  );
};
export default InputWithText;
