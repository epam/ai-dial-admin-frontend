'use client';

import { DialInputProps, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';
import classNames from 'classnames';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { CONTROL_WITH_BUTTON_WIDTH, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props extends DialInputProps {
  value?: string;
  fieldTitle: string;
  errorText?: string;
  fullValue?: string;
  copyable?: boolean;
  optional?: boolean;
  isFullWidth?: boolean;
}

const ComplexInput: FC<Props> = ({ fullValue, fieldTitle, isFullWidth, copyable = true, ...props }) => {
  const t = useI18n();
  return (
    <div className={classNames('flex items-end gap-2', copyable && !isFullWidth ? STANDARD_CONTROL_WIDTH : 'w-full')}>
      <div className={isFullWidth ? 'w-full' : copyable ? CONTROL_WITH_BUTTON_WIDTH : STANDARD_CONTROL_WIDTH}>
        <DialTextInputField containerClassName="w-full" fieldTitle={fieldTitle} elementClassName="w-full" {...props} />
      </div>
      {copyable && <CopyButton valueLabel={fieldTitle} value={fullValue} buttonLabel={t(ButtonsI18nKey.Copy)} />}
    </div>
  );
};
export default ComplexInput;
