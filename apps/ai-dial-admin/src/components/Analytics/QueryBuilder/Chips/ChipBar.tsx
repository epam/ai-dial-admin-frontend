'use client';

import { FC } from 'react';

import AddChip from '@/src/components/Analytics/QueryBuilder/Chips/AddChip';
import AggregatePanel from '@/src/components/Analytics/QueryBuilder/Chips/Aggregate/AggregatePanel';
import ColumnsPanel from '@/src/components/Analytics/QueryBuilder/Chips/Columns/ColumnsPanel';
import FilterPanel from '@/src/components/Analytics/QueryBuilder/Chips/Filter/FilterPanel';
import LimitPanel from '@/src/components/Analytics/QueryBuilder/Chips/Limit/LimitPanel';
import { PeriodControl } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import PeriodPanel from '@/src/components/Analytics/QueryBuilder/Chips/Period/PeriodPanel';
import PopupChip from '@/src/components/Analytics/QueryBuilder/Chips/PopupChip';
import SortPanel from '@/src/components/Analytics/QueryBuilder/Chips/Sort/SortPanel';
import { hasAggregate } from '@/src/components/Analytics/QueryBuilder/Chips/utils/aggregate';
import {
  aggregateChipLabel,
  filterChipParts,
  periodChipLabel,
  sortChipLabel,
} from '@/src/components/Analytics/QueryBuilder/Chips/utils/labels';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FilterNodeKind, FilterPredicateNode } from '@/src/models/analytics/query-builder';

interface Props {
  period: PeriodControl | null;
  isReadOnly?: boolean;
}

const ChipBar: FC<Props> = ({ period, isReadOnly = false }) => {
  const t = useI18n();
  const { state } = useQueryBuilder();

  const predicates = state.filter.children.filter(
    (child): child is FilterPredicateNode => child.kind === FilterNodeKind.Predicate,
  );
  const isAggregate = hasAggregate(state);

  return (
    <div role="group" aria-label={t(QueryChipsI18nKey.Bar)} className="flex flex-wrap items-center gap-2">
      {period && (
        <PopupChip
          isReadOnly={isReadOnly}
          prefix={`${t(QueryChipsI18nKey.Period)}:`}
          label={periodChipLabel(period.timePeriod, period.isCustom, period.timeRange, t)}
          widthClassName="w-[600px]"
          renderPanel={(panel) => <PeriodPanel {...panel} period={period} />}
        />
      )}
      <PopupChip
        isReadOnly={isReadOnly}
        prefix={`${t(QueryBuilderI18nKey.Limit)}:`}
        label={t(QueryChipsI18nKey.LimitRows, { count: String(state.page.limit) })}
        renderPanel={(panel) => <LimitPanel {...panel} />}
      />
      {predicates.map((predicate) => {
        const { condition, value } = filterChipParts(predicate, state.fields, t);
        return (
          <PopupChip
            isReadOnly={isReadOnly}
            key={predicate.id}
            prefix={value ? condition : void 0}
            label={value || condition}
            renderPanel={(panel) => <FilterPanel {...panel} predicate={predicate} />}
          />
        );
      })}
      {isAggregate && (
        <PopupChip
          isReadOnly={isReadOnly}
          prefix={`${t(QueryBuilderI18nKey.Aggregate)}:`}
          label={aggregateChipLabel(state, t)}
          renderPanel={(panel) => <AggregatePanel {...panel} />}
        />
      )}
      {!isAggregate && state.select.length > 0 && (
        <PopupChip
          isReadOnly={isReadOnly}
          prefix={`${t(QueryChipsI18nKey.ShowColumns)}:`}
          label={t(QueryChipsI18nKey.ColumnsCount, { count: String(state.select.length) })}
          renderPanel={(panel) => <ColumnsPanel {...panel} />}
        />
      )}
      {state.sort.map((row) => (
        <PopupChip
          isReadOnly={isReadOnly}
          key={row.id}
          prefix={`${t(QueryBuilderI18nKey.Sort)}:`}
          label={sortChipLabel(row, state.fields, t)}
          renderPanel={(panel) => <SortPanel {...panel} row={row} />}
        />
      ))}
      {!isReadOnly && <AddChip />}
    </div>
  );
};

export default ChipBar;
