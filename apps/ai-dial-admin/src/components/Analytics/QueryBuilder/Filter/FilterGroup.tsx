import { FC } from 'react';

import classNames from 'classnames';
import { DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import FilterCondition from '@/src/components/Analytics/QueryBuilder/Filter/FilterCondition';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import SectionAction from '@/src/components/Analytics/QueryBuilder/Common/SectionAction';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { LOGICAL_OPERATOR_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { ButtonsI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FieldOption, FilterGroupNode, FilterNodeKind, QueryBuilderColor } from '@/src/models/analytics/query-builder';
import { QueryLogicalOperator } from '@/src/models/analytics/query';

interface Props {
  node: FilterGroupNode;
  parent: FilterGroupNode | null;
  fieldOptions: FieldOption[];
  // Group nesting level: the visual builder shows the root (0) plus one nested level (1). Nested
  // groups hold only conditions — deeper nesting is expressible only in the SQL view. The root's
  // add actions live in the surrounding SectionBlock header, not here.
  depth?: number;
  // The owning section's palette color (Filter vs Having) — tints group accents and condition chips.
  color?: QueryBuilderColor;
}

const FilterGroup: FC<Props> = ({ node, parent, fieldOptions, depth = 0, color = QueryBuilderColor.Grouping }) => {
  const t = useI18n();
  const { refresh } = useQueryBuilder();

  const isRoot = depth === 0;
  // Combining conditions only matters once there is something to combine.
  const showOperator = node.children.length > 1 || !isRoot;

  const addCondition = () => {
    node.children.push(createPredicate());
    refresh();
  };

  const remove = () => {
    if (!parent) return;
    parent.children = parent.children.filter((c) => c !== node);
    refresh();
  };

  const operatorSelect = (
    <div className="w-[84px] shrink-0">
      <CompactSelect
        ariaLabel={t(QueryBuilderI18nKey.Operator)}
        options={LOGICAL_OPERATOR_OPTIONS}
        value={node.op}
        onChange={(v) => {
          node.op = v as QueryLogicalOperator;
          refresh();
        }}
      />
    </div>
  );

  return (
    <div
      className={classNames(
        'flex flex-col gap-1.5',
        !isRoot &&
          classNames(
            'rounded border border-primary border-l-2 bg-layer-2 p-2',
            QUERY_BUILDER_PALETTE[color].borderAccent,
          ),
      )}
    >
      {!isRoot && (
        <div className="flex items-center gap-1.5">
          {operatorSelect}
          <SectionAction label={t(QueryBuilderI18nKey.AddCondition)} onClick={addCondition} />
          <div className="flex-1" />
          <DialGhostIconButton
            size={ElementSize.Small}
            aria-label={t(ButtonsI18nKey.Remove)}
            icon={<IconTrashX size={16} className="text-error" />}
            onClick={remove}
          />
        </div>
      )}
      {isRoot && showOperator && <div className="flex items-center gap-1.5">{operatorSelect}</div>}

      {node.children.length > 0 && (
        <div className={classNames('flex flex-col gap-1.5', !isRoot && 'border-l border-primary pl-2')}>
          {node.children.map((child) =>
            child.kind === FilterNodeKind.Group ? (
              <FilterGroup
                key={child.id}
                node={child}
                parent={node}
                fieldOptions={fieldOptions}
                depth={depth + 1}
                color={color}
              />
            ) : (
              <FilterCondition key={child.id} node={child} parent={node} fieldOptions={fieldOptions} color={color} />
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default FilterGroup;
