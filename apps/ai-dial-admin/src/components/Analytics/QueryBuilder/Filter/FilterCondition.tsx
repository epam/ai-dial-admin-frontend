import { FC, useMemo } from 'react';

import classNames from 'classnames';
import { SelectOption } from '@epam/ai-dial-ui-kit';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import ChipRow from '@/src/components/Analytics/QueryBuilder/Common/ChipRow';
import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import FnArgEditor from '@/src/components/Analytics/QueryBuilder/Common/FnArgEditor';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { defaultValueType, fieldDisplayName } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import {
  emptyArgs,
  functionArgSummary,
  functionByName,
  functionResultType,
  operandFunctionOptions,
} from '@/src/components/Analytics/QueryBuilder/utils/functions';
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
  FnArgValue,
  QueryBuilderColor,
} from '@/src/models/analytics/query-builder';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { QueryOperator, QueryValueType } from '@/src/models/analytics/query';

interface Props {
  node: FilterPredicateNode;
  parent: FilterGroupNode;
  fieldOptions: FieldOption[];
  operatorOptions: SelectOption[];
  // Collapsed-chip tint from the owning section (Filter vs Having).
  color?: QueryBuilderColor;
  // Whether a scalar function may stand in for the column on the left of the condition. Having says
  // no: its operands are the query's own output columns, not the source's.
  isFunctionOperandOffered?: boolean;
}

const isNullable = (op: QueryOperator): boolean => op === QueryOperator.Eq || op === QueryOperator.Ne;

// How the left operand reads in the collapsed row.
const operandSummary = (node: FilterPredicateNode, options: FieldOption[], fn?: QueryFunction): string => {
  if (!node.fn) return node.field ? fieldDisplayName(options, node.field) : '…';
  const args = fn ? functionArgSummary(fn, node.args, (name) => fieldDisplayName(options, name)) : '';
  return `${node.fn}(${args})`;
};

const summaryOf = (
  node: FilterPredicateNode,
  options: FieldOption[],
  operatorOptions: SelectOption[],
  fn?: QueryFunction,
): string =>
  `${operandSummary(node, options, fn)} ${compactSelectLabel(operatorOptions, node.op)} ${
    node.isNull ? 'null' : node.value || '…'
  }`;

const BOOLEAN_VALUES = ['true', 'false'];

const BOOLEAN_ACTIVE = QUERY_BUILDER_PALETTE[QueryBuilderColor.Dimension];

const fieldTypeOf = (options: FieldOption[], name: string): string | undefined =>
  options.find((o) => o.name === name)?.type;

const isEnumType = (type?: string): boolean => type === AnalyticsFieldType.Enum;

const FilterCondition: FC<Props> = ({
  node,
  parent,
  fieldOptions,
  operatorOptions,
  color,
  isFunctionOperandOffered,
}) => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  const fn = functionByName(state.functions, node.fn);
  const functionOptions = useMemo(
    () => (isFunctionOperandOffered ? operandFunctionOptions(state.functions) : undefined),
    [isFunctionOperandOffered, state.functions],
  );

  // One resolver for both type-dependent rules below, so the value type and the operator list can
  // never disagree about what the left operand is.
  const operandType = (): string | undefined => {
    if (!node.fn) return fieldTypeOf(fieldOptions, node.field);
    return fn ? functionResultType(fn, node.args, state.fields) : undefined;
  };
  const isEnumOperand = isEnumType(operandType());

  // Keyed on the resolved type alone — no list here names which fields are enums, so a field an instance
  // begins reporting as one is guarded with no change. The unfiltered `operatorOptions` still back the
  // collapsed summary below, so a JSON-authored predicate carrying a withheld operator still reads by name
  // instead of falling back to its code.
  const availableOperatorOptions = useMemo(
    () =>
      isEnumOperand
        ? operatorOptions.filter((option) => !ENUM_UNSUPPORTED_OPERATORS.includes(option.value as QueryOperator))
        : operatorOptions,
    [isEnumOperand, operatorOptions],
  );

  // Retargeting a contains condition at an enum operand would otherwise leave it serializing a predicate
  // the service rejects outright, taking the whole query down rather than this one condition.
  const guardEnumOperator = (type?: string) => {
    if (isEnumType(type) && ENUM_UNSUPPORTED_OPERATORS.includes(node.op)) node.op = QueryOperator.Eq;
  };

  const onChangeField = (value: string) => {
    node.fn = null;
    node.args = [];
    node.field = value;
    const fieldType = fieldTypeOf(fieldOptions, value);
    node.valueType = defaultValueType(fieldType);
    guardEnumOperator(fieldType);
    refresh();
  };

  const onSelectFunction = (name: string) => {
    const picked = functionByName(state.functions, name);
    if (!picked) return;
    node.fn = picked.name;
    node.field = '';
    node.args = emptyArgs(picked);
    const resultType = functionResultType(picked, node.args, state.fields);
    node.valueType = defaultValueType(resultType);
    guardEnumOperator(resultType);
    refresh();
  };

  const onChangeArg = (index: number, value: FnArgValue) => {
    node.args[index] = value;
    // A function that returns its argument's own type changes what the operand is as its arguments
    // change; the value type stays as chosen, but a now-invalid operator cannot be left standing.
    if (fn) guardEnumOperator(functionResultType(fn, node.args, state.fields));
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
    <ChipRow summary={summaryOf(node, fieldOptions, operatorOptions, fn)} onRemove={remove} color={color}>
      <CategorizedFieldDropdown
        id={`qb-cond-field-${node.id}`}
        mode={FieldDropdownMode.Picker}
        options={fieldOptions}
        value={node.fn ?? node.field}
        functions={functionOptions}
        placeholder={t(QueryBuilderI18nKey.FieldPlaceholder)}
        ariaLabel={t(QueryBuilderI18nKey.Field)}
        onSelect={onChangeField}
        onSelectFunction={onSelectFunction}
      />
      {!!fn?.args.length && (
        <div className="flex flex-wrap items-center gap-1.5">
          {fn.args.map((arg, i) => (
            <FnArgEditor
              key={`${node.id}-${i}`}
              id={`qb-cond-${node.id}-arg-${i}`}
              arg={arg}
              value={node.args[i] ?? {}}
              fieldOptions={fieldOptions}
              onChange={(value) => onChangeArg(i, value)}
            />
          ))}
        </div>
      )}
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
