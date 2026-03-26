import { FC } from 'react';

import { DialInput, DialNumberInput, DialSelectField, DialSwitch } from '@epam/ai-dial-ui-kit';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { MetricBinding } from '@/src/models/evaluation/metric';

interface Props {
  field: SchemaFieldRow;
  label?: boolean;
  binding?: MetricBinding;
  onChangeValue: (fieldId: string, value: string) => void;
}

const MetricControl: FC<Props> = ({ binding, field, label = true, onChangeValue }) => {
  const t = useI18n();
  const valuePlaceholder = t(EntityPlaceholdersI18nKey.Value);

  return (
    <div key={field.id}>
      {field.type === 'string' &&
        (field.enum ? (
          <DialSelectField
            id={field.id}
            label={label ? field.name : undefined}
            caption={field.description}
            options={field.enum.map((item) => ({ label: item, value: item }))}
            value={binding?.source.value as string | undefined}
            onChange={(v) => onChangeValue(field.name, v as string)}
          />
        ) : (
          <DialInput
            id={field.id}
            placeholder={valuePlaceholder}
            labelProps={label ? { required: field.required, label: field.name, caption: field.description } : undefined}
            value={binding?.source.value as string | undefined}
            onChange={(v) => onChangeValue(field.name, v as string)}
          />
        ))}

      {(field.type === 'integer' || field.type === 'number') && (
        <DialNumberInput
          id={field.id}
          placeholder={valuePlaceholder}
          labelProps={label ? { required: field.required, label: field.name, caption: field.description } : undefined}
          value={binding?.source.value as number | undefined}
          onChange={(v) => onChangeValue(field.name, v as string)}
        />
      )}

      {field.type === 'boolean' && (
        <DialSwitch
          switchId={field.id}
          label={label ? field.name : undefined}
          caption={field.description}
          isOn={binding?.source.value as boolean | undefined}
          onChange={(v) => onChangeValue(field.name, v.toString())}
        />
      )}
    </div>
  );
};

export default MetricControl;
