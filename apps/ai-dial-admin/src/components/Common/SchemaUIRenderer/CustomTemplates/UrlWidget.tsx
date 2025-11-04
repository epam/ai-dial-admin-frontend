import { FC } from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

export const URLWidget: FC<WidgetProps> = ({
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
      <DialTextInputField
        containerCssClass={'flex w-full max-w-[600px]'}
        elementId={id}
        disabled={disabled}
        readonly={readonly}
        onChange={onChange}
        placeholder={placeholder}
        optional={!required}
        invalid={required ? !value : false}
        value={value}
      />
    </div>
  );
};
