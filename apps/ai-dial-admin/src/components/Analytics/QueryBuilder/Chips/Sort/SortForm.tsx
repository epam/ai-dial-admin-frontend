'use client';

import { FC, useId } from 'react';

import { Select, SelectOption } from '@epam/ai-dial-ui-kit';

import { SORT_DIRECTION_I18N } from '@/src/components/Analytics/QueryBuilder/Chips/constants';
import { SortChipForm } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { BasicI18nKey, QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QuerySortDirection } from '@/src/models/analytics/query';

interface Props {
  form: SortChipForm;
  fieldOptions: SelectOption[];
  onChange: (form: SortChipForm) => void;
}

const SortForm: FC<Props> = ({ form, fieldOptions, onChange }) => {
  const t = useI18n();
  const id = useId();

  const directionOptions = Object.values(QuerySortDirection).map((dir) => ({
    value: dir,
    label: t(SORT_DIRECTION_I18N[dir]),
  }));

  return (
    <>
      <Select
        id={`${id}-field`}
        searchable
        searchPlaceholder={t(BasicI18nKey.Search)}
        labelProps={{ label: t(QueryChipsI18nKey.Field) }}
        options={fieldOptions}
        value={form.field}
        onChange={(value) => onChange({ ...form, field: value as string })}
      />
      <Select
        id={`${id}-direction`}
        labelProps={{ label: t(QueryBuilderI18nKey.Direction) }}
        options={directionOptions}
        value={form.dir}
        onChange={(value) => onChange({ ...form, dir: value as string })}
      />
    </>
  );
};

export default SortForm;
