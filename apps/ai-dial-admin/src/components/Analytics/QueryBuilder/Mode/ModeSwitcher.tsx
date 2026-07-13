'use client';

import { FC } from 'react';

import { DialSegmentedControl } from '@epam/ai-dial-ui-kit';
import type { SegmentedControlOption } from '@epam/ai-dial-ui-kit';

import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryMode } from '@/src/models/analytics/query';

const ModeSwitcher: FC = () => {
  const t = useI18n();
  const { state, patch } = useQueryBuilder();

  const options: SegmentedControlOption<QueryMode>[] = [
    { value: QueryMode.Aggregate, label: t(QueryBuilderI18nKey.AggregateMode) },
    { value: QueryMode.Row, label: t(QueryBuilderI18nKey.RowMode) },
  ];

  return (
    <DialSegmentedControl
      ariaLabel={t(QueryBuilderI18nKey.ModeSwitcher)}
      options={options}
      value={state.mode}
      onChange={(mode) => patch({ mode })}
    />
  );
};

export default ModeSwitcher;
