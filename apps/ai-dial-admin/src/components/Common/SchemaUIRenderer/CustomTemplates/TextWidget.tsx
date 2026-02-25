import { FC, useMemo } from 'react';

import { DialInput, DialNumberInput } from '@epam/ai-dial-ui-kit';
import type { WidgetProps } from '@rjsf/utils';

import { WidgetHeader } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetHeader';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

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
    <DialInput
      containerClassName="flex w-full max-w-[600px]"
      id={id}
      disabled={disabled}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      invalid={invalid}
      errorText={errorText}
      value={value}
    />
  ) : (
    <div className="flex flex-col w-full bg-layer-2 rounded p-[18px]">
      <WidgetHeader label={label} title={schema.title} description={schema.description} />
      {schema.type === 'string' && (
        <DialInput
          containerClassName="flex w-full max-w-[600px]"
          id={id}
          disabled={disabled}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          invalid={invalid}
          errorText={errorText}
          value={value}
        />
      )}
      {(schema.type === 'number' || schema.type === 'integer') && (
        <DialNumberInput
          containerClassName="flex w-full max-w-[600px]"
          id={id}
          value={value}
          placeholder={placeholder}
          required={required}
          invalid={invalid}
          errorText={errorText}
          onChange={onChange}
        />
      )}
    </div>
  );
};
