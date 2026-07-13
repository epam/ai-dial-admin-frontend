import { FC } from 'react';

import {
  DialCheckbox,
  DialGhostButton,
  DialInput,
  DialRemoveButton,
  DialSelectField,
  SelectOption,
} from '@epam/ai-dial-ui-kit';

import { AGGREGATE_FN_OPTIONS } from '@/src/constants/analytics/query-builder';
import { BasicI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { sortByName } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { createAggregate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { QueryAggregateFn } from '@/src/models/analytics/query';

const Aggregates: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  const fieldOptions: SelectOption[] = [
    { value: '', label: t(QueryBuilderI18nKey.NoArgCountAll) },
    ...sortByName(state.fields).map((f) => ({ value: f.name, label: f.name })),
  ];

  const addAggregate = () => {
    state.aggregates.push(createAggregate());
    refresh();
  };

  return (
    <div className={STANDARD_CONTROL_WIDTH}>
      <div className="flex flex-col gap-2">
        {state.aggregates.map((agg, index) => (
          <div key={agg.id} className="flex items-end gap-2">
            <DialSelectField
              id={`qb-agg-fn-${agg.id}`}
              containerClassName="w-[120px] shrink-0"
              label={index === 0 ? t(QueryBuilderI18nKey.Function) : undefined}
              options={AGGREGATE_FN_OPTIONS}
              value={agg.fn}
              onChange={(v) => {
                agg.fn = v as QueryAggregateFn;
                refresh();
              }}
            />
            <DialSelectField
              id={`qb-agg-field-${agg.id}`}
              containerClassName="flex-1 min-w-[160px]"
              label={index === 0 ? t(QueryBuilderI18nKey.Field) : undefined}
              options={fieldOptions}
              value={agg.field}
              searchable
              searchPlaceholder={t(BasicI18nKey.Search)}
              onChange={(v) => {
                agg.field = v as string;
                refresh();
              }}
            />
            <DialInput
              id={`qb-agg-alias-${agg.id}`}
              containerClassName="w-[160px] shrink-0"
              labelProps={index === 0 ? { label: t(QueryBuilderI18nKey.Alias) } : undefined}
              value={agg.alias}
              placeholder={t(QueryBuilderI18nKey.AliasPlaceholder)}
              onChange={(v) => {
                agg.alias = v ?? '';
                refresh();
              }}
            />
            <div className="flex h-[38px] items-center gap-2">
              <DialCheckbox
                id={`qb-agg-distinct-${agg.id}`}
                label={t(QueryBuilderI18nKey.Distinct)}
                checked={agg.distinct}
                onChange={(value) => {
                  agg.distinct = !!value;
                  refresh();
                }}
              />
              <DialRemoveButton
                onClick={() => {
                  state.aggregates = state.aggregates.filter((a) => a !== agg);
                  refresh();
                }}
              />
            </div>
          </div>
        ))}
        <div>
          <DialGhostButton label={t(QueryBuilderI18nKey.AddAggregate)} onClick={addAggregate} />
        </div>
      </div>
    </div>
  );
};

export default Aggregates;
