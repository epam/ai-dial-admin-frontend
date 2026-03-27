import { FC, useCallback } from 'react';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { MetricBinding } from '@/src/models/evaluation/metric';
import MetricControl from './MetricControl';

interface Props {
  title: string;
  bindings?: MetricBinding[];
  fields: SchemaFieldRow[];
  onChange?: (bindings: MetricBinding[]) => void;
}

const MetricSchemaSection: FC<Props> = ({ title, fields, bindings, onChange }) => {
  const onChangeValue = useCallback(
    (fieldId: string, value: string | string[]) => {
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
          <MetricControl
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
