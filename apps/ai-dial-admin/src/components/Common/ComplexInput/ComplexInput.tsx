'use client';

import { DialInput, DialInputProps } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { CONTROL_WITH_BUTTON_WIDTH, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { mergeClasses } from '@/src/utils/merge-classes';

interface Props extends DialInputProps {
  value?: string;
  label: string;
  error?: string;
  fullValue?: string;
  copyable?: boolean;
  isFullWidth?: boolean;
}

const ComplexInput: FC<Props> = ({ fullValue, label, isFullWidth, copyable = true, required, ...props }) => {
  const t = useI18n();
  return (
    <div className="flex items-end gap-2">
      <div className="flex items-end gap-2">
        <DialInput
          labelProps={{ label, required }}
          containerClassName={mergeClasses(
            isFullWidth ? 'w-full' : copyable ? CONTROL_WITH_BUTTON_WIDTH : STANDARD_CONTROL_WIDTH,
          )}
          {...props}
        />
        {copyable && <CopyButton valueLabel={label} value={fullValue} buttonLabel={t(ButtonsI18nKey.Copy)} />}
      </div>
    </div>
  );
};
export default ComplexInput;
