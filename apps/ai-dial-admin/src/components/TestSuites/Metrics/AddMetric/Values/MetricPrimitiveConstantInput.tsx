import { FC, useCallback, useLayoutEffect, useRef } from 'react';

import { DialNumberInput, DialSelectField, Switch, DialTextarea } from '@epam/ai-dial-ui-kit';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { BindingSourceValue } from '@/src/models/evaluation/metric';

import { getDataTypeIcon } from './typedSelectOptions';

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
 * Non-enum strings use an auto-growing textarea so short values stay one line and prompts expand without scroll.
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
  const textareaWrapRef = useRef<HTMLDivElement>(null);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaWrapRef.current?.querySelector('textarea');
    if (!textarea) return;

    textarea.style.overflowY = 'hidden';
    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 36)}px`;
  }, []);

  useLayoutEffect(() => {
    if (field.type === 'string' && !field.enum) {
      resizeTextarea();
    }
  }, [field.type, field.enum, value, resizeTextarea]);

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
      <div ref={textareaWrapRef}>
        <DialTextarea
          id={elementId}
          placeholder={valuePlaceholder}
          labelProps={labelProps}
          value={(value as string | undefined) ?? ''}
          className="resize-none !min-h-[36px] !overflow-y-hidden"
          rows={1}
          onChange={(v) => onChange(v as string)}
        />
      </div>
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
        iconBefore={getDataTypeIcon(field.type)}
        value={value as number | undefined}
        onChange={(v) => onChange(v as string)}
      />
    );
  }

  if (field.type === 'boolean') {
    return (
      <Switch
        id={elementId}
        labelProps={{ label: showFieldLabel ? field.name : undefined }}
        caption={showFieldLabel ? field.description : undefined}
        isOn={value as boolean | undefined}
        onChange={(v) => onChange(v)}
      />
    );
  }

  return null;
};

export default MetricPrimitiveConstantInput;
