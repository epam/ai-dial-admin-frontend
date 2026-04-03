import { FC, useCallback } from 'react';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { BindingSourceValue, MetricBinding } from '@/src/models/evaluation/metric';
import MetricControl from './MetricControl';
import MetricSectionTabs from './MetricSectionTabs';

interface Props {
  title: string;
  bindings?: MetricBinding[];
  fields: SchemaFieldRow[];
  schema?: object;
  onChange?: (bindings: MetricBinding[]) => void;
}

const MetricSchemaSection: FC<Props> = ({ title, fields, bindings, schema, onChange }) => {
  const onChangeValue = useCallback(
    (fieldId: string, value: BindingSourceValue) => {
      onChange?.(
        bindings?.map((binding) =>
          binding.property === fieldId ? { ...binding, source: { ...binding.source, value } } : binding,
        ) || [],
      );
    },
    [bindings, onChange],
  );

  if (!fields.length && !schema) {
    return null;
  }

  const controlsContent = (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <MetricControl
          key={field.id}
          field={field}
          binding={bindings?.find((b) => b.property === field.name)}
          onChangeValue={onChangeValue}
        />
      ))}
    </div>
  );

  return <MetricSectionTabs title={title} schema={schema} controlsContent={controlsContent} />;
};

export default MetricSchemaSection;
