import { FC } from 'react';

import { DialInput, DialRemoveButton, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import { OPERATOR_OPTIONS, VALUE_TYPE_OPTIONS } from '@/src/constants/analytics/query-builder';
import { BasicI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { defaultValueType } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { FieldOption, FilterGroupNode, FilterPredicateNode } from '@/src/models/analytics/query-builder';
import { QueryOperator, QueryValueType } from '@/src/models/analytics/query';

interface Props {
  node: FilterPredicateNode;
  parent: FilterGroupNode;
  fieldOptions: FieldOption[];
  showLabels?: boolean;
}

const isNullable = (op: QueryOperator): boolean => op === QueryOperator.Eq || op === QueryOperator.Ne;

const FilterCondition: FC<Props> = ({ node, parent, fieldOptions, showLabels }) => {
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

  const remove = () => {
    parent.children = parent.children.filter((c) => c !== node);
    refresh();
  };

  return (
    <div className="flex items-end gap-2">
      <DialSelectField
        id={`qb-cond-field-${node.id}`}
        label={showLabels ? t(QueryBuilderI18nKey.Field) : undefined}
        options={fieldOptions.map((o) => ({ value: o.name, label: o.name }))}
        value={node.field}
        placeholder={t(QueryBuilderI18nKey.FieldPlaceholder)}
        searchable
        searchPlaceholder={t(BasicI18nKey.Search)}
        onChange={(v) => onChangeField(v as string)}
      />
      <DialSelectField
        id={`qb-cond-op-${node.id}`}
        containerClassName="w-[72px] shrink-0"
        label={showLabels ? t(QueryBuilderI18nKey.Operator) : undefined}
        options={OPERATOR_OPTIONS}
        value={node.op}
        onChange={(v) => onChangeOperator(v as string)}
      />

      {!node.isNull && (
        <DialInput
          id={`qb-cond-value-${node.id}`}
          containerClassName="flex-1 min-w-[160px]"
          labelProps={showLabels ? { label: t(QueryBuilderI18nKey.Value) } : undefined}
          value={node.value}
          placeholder={
            node.op === QueryOperator.In
              ? t(QueryBuilderI18nKey.InValuePlaceholder)
              : t(QueryBuilderI18nKey.ValuePlaceholder)
          }
          onChange={(v) => {
            node.value = v ?? '';
            refresh();
          }}
        />
      )}

      <DialSelectField
        id={`qb-cond-type-${node.id}`}
        containerClassName="w-[116px] shrink-0"
        label={showLabels ? t(QueryBuilderI18nKey.ValueType) : undefined}
        options={typeOptions}
        value={node.isNull ? QueryValueType.Null : node.valueType}
        onChange={(v) => onChangeType(v as string)}
      />

      <DialRemoveButton onClick={remove} />
    </div>
  );
};

export default FilterCondition;
