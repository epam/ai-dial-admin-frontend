import { FC, useMemo } from 'react';

import { DialNumberInputField, DialTextInputField } from '@epam/ai-dial-ui-kit';
import type { WidgetProps } from '@rjsf/utils';

import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { WidgetHeader } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetHeader';

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
  const t = useI18n();
  const invalid = useMemo(() => {
    return required ? !value : false;
  }, [required, value]);
  const errorText = useMemo(() => {
    return !invalid || readonly ? '' : t(ErrorI18nKey.RequiredField);
  }, [invalid, readonly, t]);

  return schema.__additional_property ? (
    <DialTextInputField
      containerClassName="flex w-full max-w-[600px]"
      elementId={id}
      disabled={disabled}
      readonly={readonly}
      onChange={onChange}
      placeholder={placeholder}
      optional={!required}
      invalid={invalid}
      errorText={errorText}
      value={value}
    />
  ) : (
    <div className="flex flex-col w-full bg-layer-2 rounded p-[18px]">
      <WidgetHeader label={label} title={schema.title} description={schema.description} />
      {schema.type === 'string' && (
        <DialTextInputField
          containerClassName="flex w-full max-w-[600px]"
          elementId={id}
          disabled={disabled}
          readonly={readonly}
          defaultEmptyText=""
          onChange={onChange}
          placeholder={placeholder}
          optional={!required}
          invalid={invalid}
          errorText={errorText}
          value={value}
        />
      )}
      {(schema.type === 'number' || schema.type === 'integer') && (
        <DialNumberInputField
          containerClassName="flex w-full max-w-[600px]"
          elementId={id}
          value={value}
          placeholder={placeholder}
          optional={!required}
          readonly={readonly}
          defaultEmptyText=""
          invalid={invalid}
          errorText={errorText}
          onChange={onChange}
        />
      )}
    </div>
  );
};
