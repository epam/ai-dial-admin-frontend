import { FC } from 'react';

import classNames from 'classnames';
import { SelectOption } from '@epam/ai-dial-ui-kit';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import ChipRow from '@/src/components/Analytics/QueryBuilder/Common/ChipRow';
import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { defaultValueType } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { OPERATOR_OPTIONS, VALUE_TYPE_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  FieldOption,
  FilterGroupNode,
  FilterPredicateNode,
  QueryBuilderColor,
} from '@/src/models/analytics/query-builder';
import { QueryOperator, QueryValueType } from '@/src/models/analytics/query';

interface Props {
  node: FilterPredicateNode;
  parent: FilterGroupNode;
  fieldOptions: FieldOption[];
  // Collapsed-chip tint from the owning section (Filter vs Having).
  color?: QueryBuilderColor;
}

const isNullable = (op: QueryOperator): boolean => op === QueryOperator.Eq || op === QueryOperator.Ne;

const summaryOf = (node: FilterPredicateNode): string =>
  `${node.field || '…'} ${node.op} ${node.isNull ? 'null' : node.value || '…'}`;

const BOOLEAN_VALUES = ['true', 'false'];

const BOOLEAN_ACTIVE = QUERY_BUILDER_PALETTE[QueryBuilderColor.Dimension];

const FilterCondition: FC<Props> = ({ node, parent, fieldOptions, color }) => {
  const t = useI18n();
  const { refresh } = useQueryBuilder();

  const onChangeField = (value: string) => {
    node.field = value;
    node.valueType = defaultValueType(fieldOptions.find((o) => o.name === value)?.type);
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
    <ChipRow summary={summaryOf(node)} onRemove={remove} color={color}>
      <CategorizedFieldDropdown
        id={`qb-cond-field-${node.id}`}
        options={fieldOptions}
        value={node.field}
        placeholder={t(QueryBuilderI18nKey.FieldPlaceholder)}
        ariaLabel={t(QueryBuilderI18nKey.Field)}
        onSelect={onChangeField}
      />
      <div className="flex items-center gap-1.5">
        <div className="w-[76px] shrink-0">
          <CompactSelect
            ariaLabel={t(QueryBuilderI18nKey.Operator)}
            options={OPERATOR_OPTIONS}
            value={node.op}
            onChange={onChangeOperator}
          />
        </div>
        <div className="min-w-0 flex-1">
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
