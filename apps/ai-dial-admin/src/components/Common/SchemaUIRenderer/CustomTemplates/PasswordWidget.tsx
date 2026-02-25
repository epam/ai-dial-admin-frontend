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
  label,
}) => {
  return (
    <div className="flex flex-col w-full bg-layer-2 rounded p-[18px]">
      <WidgetHeader title={schema.title} label={label} description={schema.description} />
      <DialPasswordInput
        containerClassName="flex w-full max-w-[600px]"
        id={id}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        invalid={required ? !value : false}
        value={value}
      />
    </div>
  );
};
