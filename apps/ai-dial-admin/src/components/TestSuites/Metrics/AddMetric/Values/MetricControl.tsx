import { FC } from 'react';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BindingSourceValue, MetricBinding } from '@/src/models/evaluation/metric';

import MetricArrayControl from './MetricArrayControl';
import MetricObjectMapControl from './MetricObjectMapControl';
import MetricPrimitiveConstantInput from './MetricPrimitiveConstantInput';

interface Props {
  field: SchemaFieldRow;
  label?: boolean;
  binding?: MetricBinding;
  onChangeValue: (fieldId: string, value: BindingSourceValue) => void;
}

const PRIMITIVE_TYPES = new Set<SchemaFieldRow['type']>(['string', 'number', 'integer', 'boolean']);

const MetricControl: FC<Props> = ({ binding, field, label = true, onChangeValue }) => {
  const t = useI18n();
  const valuePlaceholder = t(EntityPlaceholdersI18nKey.Value);

  return (
    <div key={field.id} className="w-full">
      {PRIMITIVE_TYPES.has(field.type) && (
        <MetricPrimitiveConstantInput
          elementId={field.id}
          field={field}
          value={binding?.source.value}
          onChange={(v) => onChangeValue(field.name, v)}
          valuePlaceholder={valuePlaceholder}
          showFieldLabel={label}
        />
      )}

      {field.type === 'object' && field.additionalPropertiesArrayItemType && (
        <MetricObjectMapControl
          field={field}
          binding={binding}
          label={label}
          onChangeValue={onChangeValue}
          renderNestedField={(nested) => <MetricControl {...nested} />}
        />
      )}

      {field.type === 'array' && (
        <MetricArrayControl
          field={field}
          binding={binding}
          label={label}
          onChangeValue={onChangeValue}
          renderNestedField={(nested) => <MetricControl {...nested} />}
        />
      )}
    </div>
  );
};

export default MetricControl;
