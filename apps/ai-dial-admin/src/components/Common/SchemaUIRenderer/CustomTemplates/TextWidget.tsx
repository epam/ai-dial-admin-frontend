import { FC } from 'react';

import { DialNumberInputField, DialTextInputField } from '@epam/ai-dial-ui-kit';
import type { WidgetProps } from '@rjsf/utils';

import { WidgetHeader } from './WidgetHeader';

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
  return schema.__additional_property ? (
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
  ) : (
    <div className="flex flex-col w-full bg-layer-2 p-[18px]">
      <WidgetHeader label={label} title={schema.title} />
      {schema.type === 'string' && (
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
      )}
      {(schema.type === 'number' || schema.type === 'integer') && (
        <DialNumberInputField
          containerCssClass={'flex w-full max-w-[600px]'}
          elementId={id}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
      )}
    </div>
  );
};
