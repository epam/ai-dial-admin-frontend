import { FC } from 'react';

import { DialPasswordInput } from '@epam/ai-dial-ui-kit';
import type { WidgetProps } from '@rjsf/utils';

import { WidgetHeader } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetHeader';

export const PasswordWidget: FC<WidgetProps> = ({
  id,
  value,
  required,
  disabled,
  onChange,
  placeholder,
  schema,
  readonly,
  label,
}) => {
  return (
    <div className="flex flex-col w-full bg-layer-2 rounded p-[18px]">
      <WidgetHeader required={required} title={schema.title} label={label} caption={schema.description} />
      <DialPasswordInput
        containerClassName="flex w-full max-w-[600px]"
        id={id}
        disabled={disabled || readonly}
        onChange={onChange}
        placeholder={placeholder}
        invalid={required ? !value : false}
        value={value}
      />
    </div>
  );
};
