import { FC } from 'react';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import ChipRow from '@/src/components/Analytics/QueryBuilder/Common/ChipRow';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import SectionAction from '@/src/components/Analytics/QueryBuilder/Common/SectionAction';
import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { sortFieldOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { createSort } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { SORT_DIRECTION_OPTIONS, SORT_NULLS_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QuerySortDirection, QuerySortNulls } from '@/src/models/analytics/query';
import { QueryBuilderColor, SortRow } from '@/src/models/analytics/query-builder';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';

const summaryOf = (sort: SortRow): string => `${sort.field || '…'} ${sort.dir.toUpperCase()}`;

const SortKeys: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  const fieldOptions = sortFieldOptions(state);

  const addSort = () => {
    state.sort.push(createSort());
    refresh();
  };

  return (
    <SectionBlock
      title={t(QueryBuilderI18nKey.Sort)}
      markerClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Keyword].marker}
      action={<SectionAction label={t(QueryBuilderI18nKey.AddField)} onClick={addSort} />}
    >
      <div className="flex flex-col gap-1.5">
        {state.sort.map((sort) => (
          <ChipRow
            key={sort.id}
            inline
            color={QueryBuilderColor.Keyword}
            summary={summaryOf(sort)}
            onRemove={() => {
              state.sort = state.sort.filter((s) => s !== sort);
              refresh();
            }}
          >
            <div className="min-w-0 flex-1">
              <CategorizedFieldDropdown
                id={`qb-sort-field-${sort.id}`}
                options={fieldOptions}
                value={sort.field}
                placeholder={t(QueryBuilderI18nKey.FieldPlaceholder)}
                ariaLabel={t(QueryBuilderI18nKey.Field)}
                onSelect={(name) => {
                  sort.field = name;
                  refresh();
                }}
              />
            </div>
            <div className="w-[68px] shrink-0">
              <CompactSelect
                ariaLabel={t(QueryBuilderI18nKey.Direction)}
                options={SORT_DIRECTION_OPTIONS}
                value={sort.dir}
                onChange={(v) => {
                  sort.dir = v as QuerySortDirection;
                  refresh();
                }}
              />
            </div>
            <div className="w-[134px] shrink-0">
              <CompactSelect
                ariaLabel={t(QueryBuilderI18nKey.Nulls)}
                prefix={t(QueryBuilderI18nKey.NullsPrefix)}
                options={SORT_NULLS_OPTIONS}
                value={sort.nulls}
                onChange={(v) => {
                  sort.nulls = v as QuerySortNulls;
                  refresh();
                }}
              />
            </div>
          </ChipRow>
        ))}
        {!state.sort.length && <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoFields)}</span>}
      </div>
    </SectionBlock>
  );
};

export default SortKeys;
