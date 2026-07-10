import { FC } from 'react';

import { DialGhostButton, DialRemoveButton, DialSelectField } from '@epam/ai-dial-ui-kit';

import { SORT_DIRECTION_OPTIONS, SORT_NULLS_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { sortFieldOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { createSort } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { QuerySortDirection, QuerySortNulls } from '@/src/models/analytics/query';

const SortKeys: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();
  const fieldOptions = sortFieldOptions(state);

  return (
    <div className={STANDARD_CONTROL_WIDTH}>
      <div className="flex flex-col gap-2">
        {state.sort.map((sort, index) => (
          <div key={sort.id} className="flex items-end gap-2">
            <DialSelectField
              id={`qb-sort-field-${sort.id}`}
              containerClassName="flex-1 min-w-[160px]"
              label={index === 0 ? t(QueryBuilderI18nKey.Field) : undefined}
              options={fieldOptions.map((f) => ({ value: f.name, label: f.name }))}
              value={sort.field}
              placeholder={t(QueryBuilderI18nKey.FieldPlaceholder)}
              onChange={(v) => {
                sort.field = v as string;
                refresh();
              }}
            />
            <DialSelectField
              id={`qb-sort-dir-${sort.id}`}
              containerClassName="w-[96px] shrink-0"
              label={index === 0 ? t(QueryBuilderI18nKey.Direction) : undefined}
              options={SORT_DIRECTION_OPTIONS}
              value={sort.dir}
              onChange={(v) => {
                sort.dir = v as QuerySortDirection;
                refresh();
              }}
            />
            <DialSelectField
              id={`qb-sort-nulls-${sort.id}`}
              containerClassName="w-[136px] shrink-0"
              label={index === 0 ? t(QueryBuilderI18nKey.Nulls) : undefined}
              options={SORT_NULLS_OPTIONS}
              value={sort.nulls}
              onChange={(v) => {
                sort.nulls = v as QuerySortNulls;
                refresh();
              }}
            />
            <DialRemoveButton
              onClick={() => {
                state.sort = state.sort.filter((s) => s !== sort);
                refresh();
              }}
            />
          </div>
        ))}
        <div>
          <DialGhostButton
            label={t(QueryBuilderI18nKey.AddSortKey)}
            onClick={() => {
              state.sort.push(createSort());
              refresh();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SortKeys;
