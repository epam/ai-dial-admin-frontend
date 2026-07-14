import { FC } from 'react';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import ChipRow from '@/src/components/Analytics/QueryBuilder/Common/ChipRow';
import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import SectionAction from '@/src/components/Analytics/QueryBuilder/Common/SectionAction';
import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { fieldsToOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { getAggregateWarnings } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { createAggregate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import {
  AGGREGATE_FN_OPTIONS,
  AGGREGATE_SECTION_WARNINGS,
  WARNING_I18N,
} from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryAggregateFn } from '@/src/models/analytics/query';
import { AggregateRow, QueryBuilderColor } from '@/src/models/analytics/query-builder';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';

const summaryOf = (agg: AggregateRow): string => `${agg.fn}(${agg.field || '*'})${agg.alias ? ` AS ${agg.alias}` : ''}`;

const Aggregates: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  const fieldOptions = fieldsToOptions(state.fields);
  const warnings = getAggregateWarnings(state).filter((w) => AGGREGATE_SECTION_WARNINGS.includes(w));
  const warning = warnings.length ? warnings.map((w) => t(WARNING_I18N[w])).join(' ') : undefined;

  const addAggregate = () => {
    state.aggregates.push(createAggregate());
    refresh();
  };

  return (
    <SectionBlock
      title={t(QueryBuilderI18nKey.Aggregate)}
      markerClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Measure].marker}
      warning={warning}
      action={<SectionAction label={t(QueryBuilderI18nKey.AddField)} onClick={addAggregate} />}
    >
      <div className="flex flex-col gap-1.5">
        {state.aggregates.map((agg) => (
          <ChipRow
            key={agg.id}
            inline
            color={QueryBuilderColor.Measure}
            summary={summaryOf(agg)}
            onRemove={() => {
              state.aggregates = state.aggregates.filter((a) => a !== agg);
              refresh();
            }}
          >
            <div className="w-[92px] shrink-0">
              <CompactSelect
                ariaLabel={t(QueryBuilderI18nKey.Function)}
                options={AGGREGATE_FN_OPTIONS}
                value={agg.fn}
                onChange={(v) => {
                  agg.fn = v as QueryAggregateFn;
                  refresh();
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <CategorizedFieldDropdown
                id={`qb-agg-field-${agg.id}`}
                options={fieldOptions}
                value={agg.field}
                emptyOptionLabel={t(QueryBuilderI18nKey.NoArgCountAll)}
                ariaLabel={t(QueryBuilderI18nKey.Field)}
                onSelect={(name) => {
                  agg.field = name;
                  refresh();
                }}
              />
            </div>
            <CompactInput
              ariaLabel={t(QueryBuilderI18nKey.AliasPlaceholder)}
              className="w-[88px] shrink-0"
              value={agg.alias}
              placeholder={t(QueryBuilderI18nKey.AliasPlaceholder)}
              onChange={(value) => {
                agg.alias = value;
                refresh();
              }}
            />
          </ChipRow>
        ))}
        {!state.aggregates.length && (
          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.CountOnly)}</span>
        )}
      </div>
    </SectionBlock>
  );
};

export default Aggregates;
