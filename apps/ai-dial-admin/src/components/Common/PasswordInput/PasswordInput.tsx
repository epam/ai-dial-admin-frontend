'use client';

import { FC, useCallback, useState } from 'react';

import { InputProps } from '@/src/components/Common/Input/Input';
import InputWithIcon from '@/src/components/Common/Input/InputWithIcon';
import HideIcon from './Icons/HideIcon';
import ShowIcon from './Icons/ShowIcon';

const PasswordInput: FC<InputProps> = ({ ...props }) => {
  const [showValue, setShowValue] = useState(false);

  const onChangeShowValue = useCallback((v: boolean) => {
    setShowValue(v);
  }, []);

  return (
    <InputWithIcon
      type={showValue ? 'text' : 'password'}
      {...props}
      iconAfterInput={
        showValue ? (
          <HideIcon onClick={() => onChangeShowValue(false)} />
        ) : (
          <ShowIcon onClick={() => onChangeShowValue(true)} />
        )
      }
    />
  );
};
export default PasswordInput;
