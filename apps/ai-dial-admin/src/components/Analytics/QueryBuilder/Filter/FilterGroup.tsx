import { FC } from 'react';

import { DialGhostButton, DialRemoveButton, DialSelectField } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { LOGICAL_OPERATOR_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import FilterCondition from '@/src/components/Analytics/QueryBuilder/Filter/FilterCondition';
import { createGroup, createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { FieldOption, FilterGroupNode, FilterNodeKind } from '@/src/models/analytics/query-builder';
import { QueryLogicalOperator } from '@/src/models/analytics/query';

interface Props {
  node: FilterGroupNode;
  parent: FilterGroupNode | null;
  fieldOptions: FieldOption[];
}

const FilterGroup: FC<Props> = ({ node, parent, fieldOptions }) => {
  const t = useI18n();
  const { refresh } = useQueryBuilder();

  const addCondition = () => {
    node.children.push(createPredicate());
    refresh();
  };

  const addGroup = () => {
    node.children.push(createGroup());
    refresh();
  };

  const remove = () => {
    if (!parent) return;
    parent.children = parent.children.filter((c) => c !== node);
    refresh();
  };

  const firstConditionId = node.children.find((c) => c.kind === FilterNodeKind.Predicate)?.id;

  return (
    <div
      className={classNames('flex flex-col gap-2', parent ? 'border-l border-primary pl-3' : STANDARD_CONTROL_WIDTH)}
    >
      <div className="flex items-end gap-2">
        <DialSelectField
          id={`qb-group-op-${node.id}`}
          containerClassName="w-[120px]"
          options={LOGICAL_OPERATOR_OPTIONS}
          value={node.op}
          onChange={(v) => {
            node.op = v as QueryLogicalOperator;
            refresh();
          }}
        />
        <DialGhostButton label={t(QueryBuilderI18nKey.AddCondition)} onClick={addCondition} />
        <DialGhostButton label={t(QueryBuilderI18nKey.AddGroup)} onClick={addGroup} />
        {parent && <DialRemoveButton onClick={remove} />}
      </div>

      {node.children.length > 0 && (
        <div className="flex flex-col gap-2 pl-3">
          {node.children.map((child) =>
            child.kind === FilterNodeKind.Group ? (
              <FilterGroup key={child.id} node={child} parent={node} fieldOptions={fieldOptions} />
            ) : (
              <FilterCondition
                key={child.id}
                node={child}
                parent={node}
                fieldOptions={fieldOptions}
                showLabels={child.id === firstConditionId}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default FilterGroup;
