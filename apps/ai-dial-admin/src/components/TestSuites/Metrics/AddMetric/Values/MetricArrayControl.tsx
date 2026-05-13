import { FC, Fragment, ReactNode } from 'react';

import { ButtonAppearance, DialLabel, DialPrimaryButton, DialRemoveButton, ElementSize } from '@epam/ai-dial-ui-kit';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BindingSourceValue, MetricBinding } from '@/src/models/evaluation/metric';
import { IconPlus } from '@tabler/icons-react';
import { MetricBindingType } from '@/src/types/evaluation';

import MetricPrimitiveConstantInput from './MetricPrimitiveConstantInput';

export interface NestedMetricFieldRenderProps {
  field: SchemaFieldRow;
  binding: MetricBinding;
  label: boolean;
  onChangeValue: (fieldId: string, value: BindingSourceValue) => void;
}

export interface MetricArrayControlProps {
  field: SchemaFieldRow;
  label?: boolean;
  binding?: MetricBinding;
  onChangeValue: (fieldId: string, value: BindingSourceValue) => void;
  /** Injected to avoid a circular import with `MetricControl` for array-of-object rows. */
  renderNestedField: (props: NestedMetricFieldRenderProps) => ReactNode;
}

const PRIMITIVE_TYPES = new Set(['string', 'number', 'integer', 'boolean']);

const isSinglePrimitiveChild = (field: SchemaFieldRow) =>
  Boolean(field.children?.length === 1 && field.children[0] && PRIMITIVE_TYPES.has(field.children[0].type));

/** Arrays of primitives have `itemsType` set in the schema grid but no synthetic `children` rows. */
const isArrayOfPrimitiveItems = (field: SchemaFieldRow) =>
  field.type === 'array' &&
  (!field.children || field.children.length === 0) &&
  Boolean(field.itemsType && PRIMITIVE_TYPES.has(field.itemsType));

const ARRAY_ROW_CLASS = 'flex items-end gap-2 border border-primary rounded p-3';

const ArrayItemRow: FC<{ children: ReactNode; onRemove: () => void }> = ({ children, onRemove }) => (
  <div className={ARRAY_ROW_CLASS}>
    <div className="flex-1">{children}</div>
    <DialRemoveButton onClick={onRemove} />
  </div>
);

const ArrayEditorFrame: FC<{
  field: SchemaFieldRow;
  label: boolean;
  onAdd: () => void;
  children: ReactNode;
}> = ({ field, label, onAdd, children }) => {
  const t = useI18n();
  return (
    <div className="flex flex-col gap-y-2">
      {label && (
        <DialLabel htmlFor={field.id} required={field.required} label={field.name} caption={field.description} />
      )}
      {children}
      <div>
        <DialPrimaryButton
          appearance={ButtonAppearance.Ghost}
          iconBefore={<IconPlus stroke={2} size={16} />}
          onClick={onAdd}
          size={ElementSize.Small}
          label={t(ButtonsI18nKey.Add)}
        />
      </div>
    </div>
  );
};

const MetricArrayControl: FC<MetricArrayControlProps> = ({
  binding,
  field,
  label = true,
  onChangeValue,
  renderNestedField,
}) => {
  const t = useI18n();
  const valuePlaceholder = t(EntityPlaceholdersI18nKey.Value);

  if (isArrayOfPrimitiveItems(field)) {
    const itemsType = field.itemsType!;
    const primitiveValues = (binding?.source.value as (string | number | boolean)[]) || [];

    const defaultPrimitive = (): string | number | boolean =>
      itemsType === 'boolean' ? false : itemsType === 'number' || itemsType === 'integer' ? '' : '';

    const itemFieldForCell: SchemaFieldRow = { ...field, type: itemsType };

    const onAdd = () => {
      onChangeValue(field.name, [...primitiveValues, defaultPrimitive()] as BindingSourceValue);
    };

    const onRemove = (index: number) => {
      onChangeValue(field.name, primitiveValues.filter((_, i) => i !== index) as BindingSourceValue);
    };

    const onChangeItem = (index: number, value: BindingSourceValue) => {
      const next = [...primitiveValues];
      next[index] = value as string | number | boolean;
      onChangeValue(field.name, next as BindingSourceValue);
    };

    return (
      <ArrayEditorFrame field={field} label={label} onAdd={onAdd}>
        {primitiveValues.map((itemValue, index) => (
          <ArrayItemRow key={index} onRemove={() => onRemove(index)}>
            <MetricPrimitiveConstantInput
              elementId={`${field.id}-${index}`}
              field={itemFieldForCell}
              value={itemValue}
              onChange={(v) => onChangeItem(index, v)}
              valuePlaceholder={valuePlaceholder}
              showFieldLabel={false}
            />
          </ArrayItemRow>
        ))}
      </ArrayEditorFrame>
    );
  }

  if (!field.children || field.children.length === 0) {
    return null;
  }

  const values = (binding?.source.value as string[] | Record<string, unknown>[]) || [];

  const onAdd = () => {
    const defaultValue = isSinglePrimitiveChild(field) ? '' : {};
    onChangeValue(field.name, [...values, defaultValue] as BindingSourceValue);
  };

  const onRemove = (index: number) => {
    onChangeValue(field.name, values.filter((_, i) => i !== index) as BindingSourceValue);
  };

  const onChangeNested = (index: number, fieldId: string, value: BindingSourceValue) => {
    const newItems = [...values];

    if (isSinglePrimitiveChild(field)) {
      (newItems as string[])[index] = value as string;
    } else {
      newItems[index] = { ...((newItems[index] as Record<string, unknown>) || {}), [fieldId]: value };
    }
    onChangeValue(field.name, newItems as BindingSourceValue);
  };

  return (
    <ArrayEditorFrame field={field} label={label} onAdd={onAdd}>
      {values.map((itemValue, index) => (
        <ArrayItemRow key={index} onRemove={() => onRemove(index)}>
          <div className="">
            {field.children.map((childField) => {
              const fieldValue = isSinglePrimitiveChild(field)
                ? itemValue
                : ((itemValue as Record<string, unknown>)?.[childField.name] as string);

              return (
                <Fragment key={childField.id}>
                  {renderNestedField({
                    field: childField,
                    binding: {
                      property: childField.name,
                      source: {
                        $type: MetricBindingType.Constant,
                        value: fieldValue as string,
                      },
                    },
                    label: field.children.length > 1,
                    onChangeValue: (fieldId, value) => onChangeNested(index, fieldId, value),
                  })}
                </Fragment>
              );
            })}
          </div>
        </ArrayItemRow>
      ))}
    </ArrayEditorFrame>
  );
};

export default MetricArrayControl;
