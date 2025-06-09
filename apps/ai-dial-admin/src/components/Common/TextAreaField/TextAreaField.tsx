'use client';

import { FC } from 'react';

import Field from '@/src/components/Common/Field/Field';
import ErrorText from '@/src/components/Common/ErrorText/ErrorText';
import { InputFieldBaseProps } from '@/src/components/Common/InputField/InputField';
import Textarea from '@/src/components/Common/Textarea/Textarea';

export interface Props extends InputFieldBaseProps {
  onChange?: (value: string) => void;
}

const TextAreaField: FC<Props> = ({ fieldTitle, optional, elementId, elementCssClass, errorText, ...props }) => {
  return (
    <div className="flex flex-col">
      <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />
      <Textarea textareaId={elementId} cssClass={elementCssClass} {...props} />
      <ErrorText errorText={errorText} />
    </div>
  );
};

export default TextAreaField;
