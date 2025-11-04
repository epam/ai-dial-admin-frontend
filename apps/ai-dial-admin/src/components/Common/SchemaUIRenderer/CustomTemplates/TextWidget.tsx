import { FC } from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { DialNumberInputField, DialTextInputField } from '@epam/ai-dial-ui-kit';

export const TextWidget: FC<WidgetProps> = ({
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
    <div className="max-w-[600px]">
      {!/\d$/.test(label) && <p className="small pb-3">{schema.title || label}</p>}
      {schema.type === 'string' && (
        <DialTextInputField
          containerCssClass={'flex w-full'}
          elementId={id}
          disabled={disabled}
          readonly={readonly}
          onChange={onChange}
          placeholder={placeholder}
          optional={!required}
          invalid={required ? !value : false}
          value={value}
        />
      )}
      {schema.type === 'number' && (
        <DialNumberInputField elementId={id} value={value} placeholder={placeholder} onChange={onChange} />
      )}
    </div>
  );
};
