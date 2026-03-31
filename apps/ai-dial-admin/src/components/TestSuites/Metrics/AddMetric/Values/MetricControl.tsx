import { FC } from 'react';

import {
  ButtonAppearance,
  DialInput,
  DialLabel,
  DialNumberInput,
  DialPrimaryButton,
  DialRemoveButton,
  DialSelectField,
  DialSwitch,
  ElementSize,
} from '@epam/ai-dial-ui-kit';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BindingSourceValue, MetricBinding } from '@/src/models/evaluation/metric';
import { IconPlus } from '@tabler/icons-react';
import { MetricBindingType } from '../../../../../types/evaluation';

interface Props {
  field: SchemaFieldRow;
  label?: boolean;
  binding?: MetricBinding;
  onChangeValue: (fieldId: string, value: BindingSourceValue) => void;
}

const PRIMITIVE_TYPES = new Set(['string', 'number', 'integer', 'boolean']);

const isSinglePrimitiveChild = (field: SchemaFieldRow) =>
  Boolean(field.children?.length === 1 && field.children[0] && PRIMITIVE_TYPES.has(field.children[0].type));

const MetricArrayControl: FC<Props> = ({ binding, field, label = true, onChangeValue }) => {
  const t = useI18n();

  if (!field.children || field.children.length === 0) {
    return null;
  }

  const values = (binding?.source.value as string[] | Record<string, unknown>[]) || [];

  const onAdd = () => {
    const defaultValue = isSinglePrimitiveChild(field) ? '' : {};
    const newValues = [...values, defaultValue];
    onChangeValue(field.name, newValues);
  };

  const onRemove = (index: number) => {
    const newItems = values.filter((_, i) => i !== index);
    onChangeValue(field.name, newItems as BindingSourceValue);
  };

  const onChange = (index: number, fieldId: string, value: BindingSourceValue) => {
    const newItems = [...values];

    if (isSinglePrimitiveChild(field)) {
      (newItems as string[])[index] = value as string;
    } else {
      // For multiple fields or complex types, update the specific field in the object
      newItems[index] = { ...((newItems[index] as Record<string, unknown>) || {}), [fieldId]: value };
    }
    onChangeValue(field.name, newItems as BindingSourceValue);
  };

  return (
    <div key={field.id} className="space-y-2">
      {label && (
        <DialLabel htmlFor={field.id} required={field.required} label={field.name} caption={field.description} />
      )}

      <div className="space-y-2">
        {values.map((itemValue, index) => (
          <div key={index} className="flex items-end gap-2 border border-primary rounded p-3">
            <div className="flex-1">
              <div className="space-y-2">
                {field.children.map((childField) => {
                  const fieldValue = isSinglePrimitiveChild(field)
                    ? itemValue
                    : ((itemValue as Record<string, unknown>)?.[childField.name] as string);

                  return (
                    <MetricControl
                      key={childField.id}
                      field={childField}
                      binding={{
                        property: childField.name,
                        source: {
                          $type: MetricBindingType.Constant,
                          value: fieldValue as string,
                        },
                      }}
                      label={field.children.length > 1}
                      onChangeValue={(fieldId, value) => onChange(index, fieldId, value)}
                    />
                  );
                })}
              </div>
            </div>
            <DialRemoveButton onClick={() => onRemove(index)} />
          </div>
        ))}
      </div>

      <DialPrimaryButton
        appearance={ButtonAppearance.Ghost}
        iconBefore={<IconPlus stroke={2} size={16} />}
        onClick={onAdd}
        size={ElementSize.Small}
        label={t(ButtonsI18nKey.Add)}
      />
    </div>
  );
};

const MetricControl: FC<Props> = ({ binding, field, label = true, onChangeValue }) => {
  const t = useI18n();
  const valuePlaceholder = t(EntityPlaceholdersI18nKey.Value);

  return (
    <div key={field.id} className="w-full">
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
