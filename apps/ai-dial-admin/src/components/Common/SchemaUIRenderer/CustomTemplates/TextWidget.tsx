import { FC } from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

export const TextWidget: FC<WidgetProps> = ({ id, value, required, disabled, readonly, onChange, placeholder }) => {
  return (
    <DialTextInputField
      containerCssClass={'flex w-full'}
      elementId={id}
      disabled={disabled}
      readonly={readonly}
      onChange={onChange}
      placeholder={placeholder}
      optional={!required}
      value={value}
    />
  );
};
