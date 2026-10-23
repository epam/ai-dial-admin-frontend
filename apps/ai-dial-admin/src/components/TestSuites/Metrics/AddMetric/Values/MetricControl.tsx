import { Label, Select } from '@epam/ai-dial-ui-kit';
import { FC, useMemo } from 'react';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BindingSourceValue, MetricBinding } from '@/src/models/evaluation/metric';

import MetricArrayControl from './MetricArrayControl';
import MetricObjectConstantInput from './MetricObjectConstantInput';
import MetricObjectMapControl from './MetricObjectMapControl';
import MetricPrimitiveConstantInput from './MetricPrimitiveConstantInput';
import { getDataTypeIcon } from './typedSelectOptions';

interface Props {
  field: SchemaFieldRow;
  label?: boolean;
  /** True when rendering a nested field inside an array item (not a top-level Constant). */
  nestedInArray?: boolean;
  binding?: MetricBinding;
  onChangeValue: (fieldId: string, value: BindingSourceValue) => void;
}

const PRIMITIVE_TYPES = new Set<SchemaFieldRow['type']>(['string', 'number', 'integer', 'boolean']);

const MetricControl: FC<Props> = ({ binding, field, label = true, nestedInArray = false, onChangeValue }) => {
  const t = useI18n();
  const valuePlaceholder = t(EntityPlaceholdersI18nKey.Value);
  const selectPlaceholder = t(EntityPlaceholdersI18nKey.Select);

  const enumArrayOptions = useMemo(
    () => (field.enum ?? []).map((item) => ({ label: item, value: item })),
    [field.enum],
  );

  const hasEnumArray = field.type === 'array' && Boolean(field.enum?.length);
  const hasObjectMap = field.type === 'object' && Boolean(field.additionalPropertiesArrayItemType);
  const useObjectJson = field.type === 'object' && !nestedInArray;
  const useNestedObjectMap = hasObjectMap && nestedInArray;

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

      {useObjectJson && (
        <MetricObjectConstantInput value={binding?.source.value} onChange={(v) => onChangeValue(field.name, v)} />
      )}

      {useNestedObjectMap && (
        <MetricObjectMapControl
          field={field}
          binding={binding}
          label={label}
          onChangeValue={onChangeValue}
          renderNestedField={(nested) => <MetricControl {...nested} nestedInArray />}
        />
      )}

      {hasEnumArray && (
        <div className="flex flex-col gap-1">
          {label && (
            <Label htmlFor={field.id} required={field.required} label={field.name} caption={field.description} />
          )}
          <div className="relative w-full">
            <span
              className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-secondary"
              aria-hidden
            >
              {getDataTypeIcon('array')}
            </span>
            <Select
              id={field.id}
              multiple
              options={enumArrayOptions}
              placeholder={selectPlaceholder}
              className="[&_.dial-input]:!pl-10"
              value={(binding?.source.value as string[] | undefined) ?? []}
              onChange={(v) => onChangeValue(field.name, v as string[])}
            />
          </div>
        </div>
      )}

      {field.type === 'array' && !hasEnumArray && (
        <MetricArrayControl
          field={field}
          binding={binding}
          label={label}
          onChangeValue={onChangeValue}
          renderNestedField={(nested) => <MetricControl {...nested} nestedInArray />}
        />
      )}
    </div>
  );
};

export default MetricControl;
