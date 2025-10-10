'use client';

import { DialInputProps, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props extends DialInputProps {
  fieldTitle: string;
  errorText?: string;
  fullValue: string;
}

const ComplexInput: FC<Props> = ({ fullValue, fieldTitle, ...props }) => {
  return (
    <div className="flex items-end gap-2 lg:w-[35%]">
      <DialTextInputField containerCssClass="flex-1" fieldTitle={fieldTitle} {...props} />
      <CopyButton title={fieldTitle} field={fullValue} isFullButton={true} />
    </div>
  );
};
export default ComplexInput;
