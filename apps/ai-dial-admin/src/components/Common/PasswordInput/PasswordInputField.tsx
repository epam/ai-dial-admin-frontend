'use client';

import { FC } from 'react';

import ErrorText from '@/src/components/Common/ErrorText/ErrorText';
import Field from '@/src/components/Common/Field/Field';
import { InputFieldBaseProps } from '@/src/components/Common/InputField/InputField';
import PasswordInput from './PasswordInput';

interface Props extends InputFieldBaseProps {
  onChange?: (value: string) => void;
}

const PasswordInputField: FC<Props> = ({ fieldTitle, optional, elementCssClass, elementId, errorText, ...props }) => {
  return (
    <div className="flex flex-col">
      <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />
      <PasswordInput cssClass={elementCssClass} inputId={elementId} {...props} />
      <ErrorText errorText={errorText} />
    </div>
  );
};
export default PasswordInputField;
