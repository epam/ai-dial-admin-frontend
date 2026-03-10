import { FC, useMemo } from 'react';

import { DialInput } from '@epam/ai-dial-ui-kit';
import type { WidgetProps } from '@rjsf/utils';

import { WidgetHeader } from '@/src/components/Common/SchemaUIRenderer/Components/WidgetHeader';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

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
  const t = useI18n();

  const invalid = useMemo(() => {
    return required ? !value : false;
  }, [required, value]);

  const errorText = useMemo(() => {
    return !invalid || readonly ? '' : t(ErrorI18nKey.RequiredField);
  }, [invalid, readonly, t]);

  return (
    <div className="flex flex-col w-full bg-layer-2 p-[18px] rounded">
      <WidgetHeader label={label} title={schema.title} caption={schema.description} required={required} />
      <DialInput
        containerClassName="flex w-full max-w-[600px]"
        id={id}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        invalid={invalid}
        error={errorText}
        value={value}
      />
    </div>
  );
};
