import { FC } from 'react';

import { DialInput, DialNumberInput, DialSelectField, DialSwitch } from '@epam/ai-dial-ui-kit';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { BindingSourceValue } from '@/src/models/evaluation/metric';

export interface MetricPrimitiveConstantInputProps {
  elementId: string;
  field: SchemaFieldRow;
  value: unknown;
  onChange: (value: BindingSourceValue) => void;
  valuePlaceholder: string;
  /** When true, show the field title/caption on controls (top-level metric input). */
  showFieldLabel: boolean;
}

/**
 * Single JSON-schema primitive editor for constant metric bindings (string with optional enum, number, boolean).
 */
const MetricPrimitiveConstantInput: FC<MetricPrimitiveConstantInputProps> = ({
  elementId,
  field,
  value,
  onChange,
  valuePlaceholder,
  showFieldLabel,
}) => {
  const labelProps = showFieldLabel
    ? { required: field.required, label: field.name, caption: field.description }
    : undefined;
  const selectLabel = showFieldLabel ? field.name : undefined;

  if (field.type === 'string') {
    if (field.enum) {
      return (
        <DialSelectField
          id={elementId}
          label={selectLabel}
          caption={showFieldLabel ? field.description : undefined}
          options={field.enum.map((item) => ({ label: item, value: item }))}
          value={value as string | undefined}
          onChange={(v) => onChange(v as string)}
        />
      );
    }
    return (
      <DialInput
        id={elementId}
        placeholder={valuePlaceholder}
        labelProps={labelProps}
        value={value as string | undefined}
        onChange={(v) => onChange(v as string)}
      />
    );
  }

  if (field.type === 'integer' || field.type === 'number') {
    return (
      <DialNumberInput
        id={elementId}
        max={field.maximum}
        min={field.minimum}
        placeholder={valuePlaceholder}
        labelProps={labelProps}
        value={value as number | undefined}
        onChange={(v) => onChange(v as string)}
      />
    );
  }

  if (field.type === 'boolean') {
    return (
      <DialSwitch
        switchId={elementId}
        label={showFieldLabel ? field.name : undefined}
        caption={showFieldLabel ? field.description : undefined}
        isOn={value as boolean | undefined}
        onChange={(v) => onChange(v)}
      />
    );
  }

  return null;
};

export default MetricPrimitiveConstantInput;
