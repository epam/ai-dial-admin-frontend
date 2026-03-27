import { FC } from 'react';

import {
  DialInput,
  SelectOption,
  DialNumberInput,
  DialSelectField,
  DialSwitch,
  DialTagInput,
} from '@epam/ai-dial-ui-kit';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { MetricBinding } from '@/src/models/evaluation/metric';

interface Props {
  field: SchemaFieldRow;
  label?: boolean;
  binding?: MetricBinding;
  onChangeValue: (fieldId: string, value: string | string[]) => void;
}

const MetricArrayControl: FC<Props> = ({ binding, field, label = true, onChangeValue }) => {
  const t = useI18n();
  const valuePlaceholder = t(EntityPlaceholdersI18nKey.Value);

  const definition = field.children[0];
  // TODO: support array of objects
  return (
    <div key={field.id}>
      {definition.type === 'string' &&
        (definition.enum ? (
          <DialSelectField
            id={field.id}
            multiple
            label={label ? field.name : undefined}
            caption={field.description}
            options={definition?.enum.map((item) => ({ label: item, value: item })) as SelectOption[]}
            value={binding?.source.value as string | undefined}
            onChange={(v) => onChangeValue(field.name, v)}
          />
        ) : (
          <DialTagInput
            elementId={field.id}
            placeholder={valuePlaceholder}
            label={label ? field.name : void 0}
            initialTags={(binding?.source.value as string[]) || []}
            onChange={(v) => onChangeValue(field.name, v)}
            collapseTagOverflow
          />
        ))}
      {(definition.type === 'integer' || definition.type === 'number') && (
        <DialTagInput
          elementId={field.id}
          placeholder={valuePlaceholder}
          label={label ? field.name : void 0}
          initialTags={(binding?.source.value as string[]) || []}
          onChange={(v) => onChangeValue(field.name, v)}
          collapseTagOverflow
        />
      )}
    </div>
  );
};

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

      {field.type === 'array' && (
        <MetricArrayControl field={field} binding={binding} label={label} onChangeValue={onChangeValue} />
      )}
    </div>
  );
};

export default MetricControl;
