import { FC } from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { DialPasswordInput } from '@epam/ai-dial-ui-kit';

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
      {!/\d$/.test(label) && <p className="small pb-3">{schema.title || label}</p>}
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
