import { FC } from 'react';

import { DialPasswordInput } from '@epam/ai-dial-ui-kit';
import type { WidgetProps } from '@rjsf/utils';

import { WidgetHeader } from './WidgetHeader';

export const PasswordWidget: FC<WidgetProps> = ({
  id,
  value,
  required,
  disabled,
  readonly,
  onChange,
  placeholder,
  schema,
  label,
}) => {
  return (
    <div className="flex flex-col w-full bg-layer-2 p-[18px]">
      <WidgetHeader title={schema.title} label={label} />
      <DialPasswordInput
        containerCssClass={'flex w-full max-w-[600px]'}
        elementId={id}
        disabled={disabled}
        readonly={readonly}
        onChange={onChange}
        placeholder={placeholder}
        invalid={required ? !value : false}
        value={value}
      />
    </div>
  );
};
