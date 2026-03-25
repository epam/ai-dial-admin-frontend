import { FC, useCallback } from 'react';

import { DialInput, DialNumberInput, DialSelectField, DialSwitch } from '@epam/ai-dial-ui-kit';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { MetricBinding } from '@/src/models/evaluation/metric';

interface MetricSchemaFieldInputProps {
  field: SchemaFieldRow;
  binding?: MetricBinding;
  onChangeValue: (fieldId: string, value: string) => void;
}

const MetricSchemaFieldInput: FC<MetricSchemaFieldInputProps> = ({ binding, field, onChangeValue }) => {
  const t = useI18n();
  const valuePlaceholder = t(EntityPlaceholdersI18nKey.Value);

  return (
    <div key={field.id}>
      {field.type === 'string' &&
        (field.enum ? (
          <DialSelectField
            id={field.id}
            label={field.name}
            caption={field.description}
            options={field.enum.map((item) => ({ label: item, value: item }))}
            value={binding?.source.value as string | undefined}
            onChange={(v) => onChangeValue(field.name, (v as string) ?? '')}
          />
        ) : (
          <DialInput
            id={field.id}
            placeholder={valuePlaceholder}
            labelProps={{ required: field.required, label: field.name, caption: field.description }}
            value={binding?.source.value as string | undefined}
            onChange={(v) => onChangeValue(field.name, (v as string) ?? '')}
          />
        ))}

      {(field.type === 'integer' || field.type === 'number') && (
        <DialNumberInput
          id={field.id}
          placeholder={valuePlaceholder}
          labelProps={{ required: field.required, label: field.name, caption: field.description }}
          value={binding?.source.value as number | undefined}
          onChange={(v) => onChangeValue(field.name, (v as string) ?? '')}
        />
      )}

      {field.type === 'boolean' && (
        <DialSwitch
          switchId={field.id}
          label={field.name}
          caption={field.description}
          isOn={binding?.source.value as boolean | undefined}
          onChange={(v) => onChangeValue(field.name, v.toString() ?? '')}
        />
      )}
    </div>
  );
};

interface Props {
  title: string;
  bindings?: MetricBinding[];
  fields: SchemaFieldRow[];
  onChange?: (bindings: MetricBinding[]) => void;
}

const MetricSchemaSection: FC<Props> = ({ title, fields, bindings, onChange }) => {
  const onChangeValue = useCallback(
    (fieldId: string, value: string) => {
      onChange?.(
        bindings?.map((binding) =>
          binding.property === fieldId ? { ...binding, source: { ...binding.source, value } } : binding,
        ) || [],
      );
    },
    [bindings, onChange],
  );

  return fields.length ? (
    <div className="flex flex-col">
      <p className="dial-small-semi mb-4">{title}</p>
      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <MetricSchemaFieldInput
            key={field.id}
            field={field}
            binding={bindings?.find((b) => b.property === field.name)}
            onChangeValue={onChangeValue}
          />
        ))}
      </div>
    </div>
  ) : null;
};

export default MetricSchemaSection;
