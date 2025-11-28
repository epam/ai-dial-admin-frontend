'use client';

import { DialInputProps, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';

interface Props extends DialInputProps {
  value?: string;
  fieldTitle: string;
  errorText?: string;
  fullValue?: string;
  copyable?: boolean;
  optional?: boolean;
}

const ComplexInput: FC<Props> = ({ fullValue, fieldTitle, copyable = true, ...props }) => {
  return (
    <div className="flex items-end gap-2 w-full">
      <div className="flex-1 min-w-0">
        <DialTextInputField containerCssClass="w-full" fieldTitle={fieldTitle} {...props} elementCssClass="w-full" />
      </div>
      {copyable && <CopyButton label={fieldTitle} field={fullValue} isFullButton={true} />}
    </div>
  );
};
export default ComplexInput;
