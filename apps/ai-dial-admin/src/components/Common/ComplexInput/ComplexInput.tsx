'use client';

import { DialInputProps, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { CONTROL_WITH_BUTTON_WIDTH, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

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
      <div className={copyable ? CONTROL_WITH_BUTTON_WIDTH : STANDARD_CONTROL_WIDTH}>
        <DialTextInputField containerClassName="w-full" fieldTitle={fieldTitle} elementClassName="w-full" {...props} />
      </div>
      {copyable && <CopyButton label={fieldTitle} field={fullValue} isFullButton={true} />}
    </div>
  );
};
export default ComplexInput;
