import { FC } from 'react';

import { DialCheckbox, SelectOption } from '@epam/ai-dial-ui-kit';

import ChipRow from '@/src/components/Analytics/QueryBuilder/Common/ChipRow';
import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import FnArgEditor from '@/src/components/Analytics/QueryBuilder/Aggregate/FnArgEditor';
import SectionAction from '@/src/components/Analytics/QueryBuilder/Common/SectionAction';
import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { fieldDisplayName, fieldsToOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import {
  aggregateFunctions,
  emptyArgs,
  functionArgSummary,
  functionByName,
} from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { getAggregateWarnings } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { createAggregate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { AGGREGATE_SECTION_WARNINGS, WARNING_I18N } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { AggregateRow, QueryBuilderColor } from '@/src/models/analytics/query-builder';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';

const summaryOf = (agg: AggregateRow, functions: QueryFunction[], fields: AnalyticsEntityField[]): string => {
  const fn = functionByName(functions, agg.fn);
  const inner = fn ? functionArgSummary(fn, agg.args, (name) => fieldDisplayName(fields, name)) : '';
  const distinct = agg.distinct ? 'distinct ' : '';
  return `${agg.fn}(${distinct}${inner})${agg.alias ? ` AS ${agg.alias}` : ''}`;
};

const Aggregates: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  const fns = aggregateFunctions(state.functions);
  const fnOptions: SelectOption[] = fns.map((fn) => ({ value: fn.name, label: fn.name.toUpperCase() }));
  const fieldOptions = fieldsToOptions(state.fields);
  const warnings = getAggregateWarnings(state).filter((w) => AGGREGATE_SECTION_WARNINGS.includes(w));
  const warning = warnings.length ? warnings.map((w) => t(WARNING_I18N[w])).join(' ') : undefined;

  const addAggregate = () => {
    const first = fns[0];
    if (!first) return;
    state.aggregates.push(createAggregate(first));
    refresh();
  };

  const onChangeFn = (agg: AggregateRow, name: string) => {
    const fn = functionByName(state.functions, name);
    if (!fn) return;
    // Switching functions re-sizes the arg slots to the new function and drops a now-invalid distinct.
    agg.fn = fn.name;
    agg.args = emptyArgs(fn);
    agg.distinct = false;
    refresh();
  };

  return (
    <SectionBlock
      title={t(QueryBuilderI18nKey.Aggregate)}
      markerClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Measure].marker}
      warning={warning}
      action={fns.length ? <SectionAction label={t(QueryBuilderI18nKey.AddField)} onClick={addAggregate} /> : undefined}
    >
      <div className="flex flex-col gap-1.5">
        {state.aggregates.map((agg) => {
          const fn = functionByName(state.functions, agg.fn);
          return (
            <ChipRow
              key={agg.id}
              inline
              color={QueryBuilderColor.Measure}
              summary={summaryOf(agg, state.functions, state.fields)}
              onRemove={() => {
                state.aggregates = state.aggregates.filter((a) => a !== agg);
                refresh();
              }}
            >
              <div className="w-[112px] shrink-0">
                <CompactSelect
                  ariaLabel={t(QueryBuilderI18nKey.Function)}
                  options={fnOptions}
                  value={agg.fn}
                  onChange={(v) => onChangeFn(agg, v)}
                />
              </div>
              {fn?.args.map((arg, i) => (
                <FnArgEditor
                  key={`${agg.id}-${i}`}
                  id={`qb-agg-${agg.id}-arg-${i}`}
                  arg={arg}
                  value={agg.args[i] ?? {}}
                  fieldOptions={fieldOptions}
                  onChange={(value) => {
                    agg.args[i] = value;
                    refresh();
                  }}
                />
              ))}
              {fn?.distinct_supported && (
                <DialCheckbox
                  id={`qb-agg-${agg.id}-distinct`}
                  checked={agg.distinct}
                  label={t(QueryBuilderI18nKey.Distinct)}
                  onChange={() => {
                    agg.distinct = !agg.distinct;
                    refresh();
                  }}
                />
              )}
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
          );
        })}
        {!state.aggregates.length && (
          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.CountOnly)}</span>
        )}
      </div>
    </SectionBlock>
  );
};

export default Aggregates;
