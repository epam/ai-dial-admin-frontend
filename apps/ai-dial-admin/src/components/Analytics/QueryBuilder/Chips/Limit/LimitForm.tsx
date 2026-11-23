'use client';

import { FC, useId } from 'react';

import { Input } from '@epam/ai-dial-ui-kit';

import { LimitChipForm } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  form: LimitChipForm;
  onChange: (form: LimitChipForm) => void;
}

const LimitForm: FC<Props> = ({ form, onChange }) => {
  const t = useI18n();
  const id = useId();

  return (
    <div className="flex gap-2">
      <Input
        id={`${id}-rows`}
        type="number"
        min={1}
        labelProps={{ label: t(QueryChipsI18nKey.Rows) }}
        value={form.rows}
        onChange={(value) => onChange({ ...form, rows: value ?? '' })}
      />
      <Input
        id={`${id}-offset`}
        type="number"
        min={0}
        labelProps={{ label: t(QueryBuilderI18nKey.Offset) }}
        value={form.offset}
        onChange={(value) => onChange({ ...form, offset: value ?? '' })}
      />
    </div>
  );
};

export default LimitForm;
