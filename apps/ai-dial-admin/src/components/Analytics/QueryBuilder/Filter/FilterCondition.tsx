import { FC, useMemo } from 'react';

import classNames from 'classnames';
import { SelectOption } from '@epam/ai-dial-ui-kit';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import ChipRow from '@/src/components/Analytics/QueryBuilder/Common/ChipRow';
import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { defaultValueType, fieldDisplayName } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { compactSelectLabel } from '@/src/components/Analytics/QueryBuilder/utils/options';
import { ENUM_UNSUPPORTED_OPERATORS, VALUE_TYPE_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  FieldDropdownMode,
  FieldOption,
  FilterGroupNode,
  FilterPredicateNode,
  QueryBuilderColor,
} from '@/src/models/analytics/query-builder';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryOperator, QueryValueType } from '@/src/models/analytics/query';

interface Props {
  node: FilterPredicateNode;
  parent: FilterGroupNode;
  fieldOptions: FieldOption[];
  operatorOptions: SelectOption[];
  // Collapsed-chip tint from the owning section (Filter vs Having).
  color?: QueryBuilderColor;
}

const isNullable = (op: QueryOperator): boolean => op === QueryOperator.Eq || op === QueryOperator.Ne;

const summaryOf = (node: FilterPredicateNode, options: FieldOption[], operatorOptions: SelectOption[]): string =>
  `${node.field ? fieldDisplayName(options, node.field) : '…'} ${compactSelectLabel(operatorOptions, node.op)} ${
    node.isNull ? 'null' : node.value || '…'
  }`;

const BOOLEAN_VALUES = ['true', 'false'];

const BOOLEAN_ACTIVE = QUERY_BUILDER_PALETTE[QueryBuilderColor.Dimension];

const fieldTypeOf = (options: FieldOption[], name: string): string | undefined =>
  options.find((o) => o.name === name)?.type;

const isEnumType = (type?: string): boolean => type === AnalyticsFieldType.Enum;

const FilterCondition: FC<Props> = ({ node, parent, fieldOptions, operatorOptions, color }) => {
  const t = useI18n();
  const { refresh } = useQueryBuilder();

  const isEnumField = isEnumType(fieldTypeOf(fieldOptions, node.field));

  // Keyed on the declared type alone — no list here names which fields are enums, so a field an instance
  // begins reporting as one is guarded with no change. The unfiltered `operatorOptions` still back the
  // collapsed summary below, so a JSON-authored predicate carrying a withheld operator still reads by name
  // instead of falling back to its code.
  const availableOperatorOptions = useMemo(
    () =>
      isEnumField
        ? operatorOptions.filter((option) => !ENUM_UNSUPPORTED_OPERATORS.includes(option.value as QueryOperator))
        : operatorOptions,
    [isEnumField, operatorOptions],
  );

  const onChangeField = (value: string) => {
    node.field = value;
    const fieldType = fieldTypeOf(fieldOptions, value);
    node.valueType = defaultValueType(fieldType);
    // Retargeting a contains condition at an enum field would otherwise leave it serializing a predicate
    // the service rejects outright, taking the whole query down rather than this one condition.
    if (isEnumType(fieldType) && ENUM_UNSUPPORTED_OPERATORS.includes(node.op)) {
      node.op = QueryOperator.Eq;
    }
    refresh();
  };

  const onChangeOperator = (value: string) => {
    node.op = value as QueryOperator;
    if (!isNullable(node.op)) node.isNull = false;
    refresh();
  };

  const typeOptions: SelectOption[] = isNullable(node.op)
    ? [...VALUE_TYPE_OPTIONS, { value: QueryValueType.Null, label: t(QueryBuilderI18nKey.IsNull) }]
    : VALUE_TYPE_OPTIONS;

  const onChangeType = (value: string) => {
    if (value === QueryValueType.Null) {
      node.isNull = true;
    } else {
      node.isNull = false;
      node.valueType = value as QueryValueType;
    }
    refresh();
  };

  const setValue = (value: string) => {
    node.value = value;
    refresh();
  };

  const remove = () => {
    parent.children = parent.children.filter((c) => c !== node);
    refresh();
  };

  const isBoolean = node.valueType === QueryValueType.Boolean && node.op !== QueryOperator.In;

  return (
    <ChipRow summary={summaryOf(node, fieldOptions, operatorOptions)} onRemove={remove} color={color}>
      <CategorizedFieldDropdown
        id={`qb-cond-field-${node.id}`}
        mode={FieldDropdownMode.Picker}
        options={fieldOptions}
        value={node.field}
        placeholder={t(QueryBuilderI18nKey.FieldPlaceholder)}
        ariaLabel={t(QueryBuilderI18nKey.Field)}
        onSelect={onChangeField}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="min-w-[200px] flex-1">
          <CompactSelect
            ariaLabel={t(QueryBuilderI18nKey.Operator)}
            options={availableOperatorOptions}
            value={node.op}
            onChange={onChangeOperator}
          />
        </div>
        <div className="min-w-[104px] flex-1">
          <CompactSelect
            ariaLabel={t(QueryBuilderI18nKey.ValueType)}
            options={typeOptions}
            value={node.isNull ? QueryValueType.Null : node.valueType}
            onChange={onChangeType}
          />
        </div>
      </div>
      {!node.isNull &&
        (isBoolean ? (
          <div
            role="group"
            aria-label={t(QueryBuilderI18nKey.ValuePlaceholder)}
            className="flex w-fit overflow-hidden rounded border border-primary"
          >
            {BOOLEAN_VALUES.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={node.value === v}
                className={classNames(
                  'px-4 py-1 font-mono dial-tiny-text',
                  node.value === v
                    ? classNames(BOOLEAN_ACTIVE.chipBg, BOOLEAN_ACTIVE.chipText)
                    : 'text-secondary hover:bg-layer-4',
                )}
                onClick={() => setValue(v)}
              >
                {v}
              </button>
            ))}
          </div>
        ) : (
          <CompactInput
            ariaLabel={t(QueryBuilderI18nKey.ValuePlaceholder)}
            className="w-full"
            value={node.value}
            placeholder={
              node.op === QueryOperator.In
                ? t(QueryBuilderI18nKey.InValuePlaceholder)
                : t(QueryBuilderI18nKey.ValuePlaceholder)
            }
            onChange={setValue}
          />
        ))}
    </ChipRow>
  );
};

export default FilterCondition;
