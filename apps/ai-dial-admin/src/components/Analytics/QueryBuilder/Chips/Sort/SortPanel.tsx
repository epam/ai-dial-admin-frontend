'use client';

import { FC, useState } from 'react';

import ChipPopupPanel from '@/src/components/Analytics/QueryBuilder/Chips/ChipPopupPanel';
import { ChipPanelProps } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import SortForm from '@/src/components/Analytics/QueryBuilder/Chips/Sort/SortForm';
import { toSelectOptions } from '@/src/components/Analytics/QueryBuilder/Chips/utils/options';
import {
  createSortForm,
  sortChipFieldOptions,
  toSortForm,
  toSortRow,
} from '@/src/components/Analytics/QueryBuilder/Chips/utils/sort';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SortRow } from '@/src/models/analytics/query-builder';

interface Props extends ChipPanelProps {
  row?: SortRow;
}

const SortPanel: FC<Props> = ({ titleId, row, onClose, onBack }) => {
  const t = useI18n();
  const { state, patch } = useQueryBuilder();
  const [form, setForm] = useState(() => (row ? toSortForm(row) : createSortForm()));

  const onChangeSort = (sort: SortRow[]) => {
    patch({ sort });
    onClose();
  };

  const onApply = () => {
    const next = toSortRow(form, row?.id);
    onChangeSort(row ? state.sort.map((key) => (key.id === row.id ? next : key)) : [...state.sort, next]);
  };

  const onRemove = () => onChangeSort(state.sort.filter((key) => key.id !== row?.id));

  return (
    <ChipPopupPanel
      titleId={titleId}
      title={t(row ? QueryBuilderI18nKey.Sort : QueryChipsI18nKey.AddSort)}
      isApplyDisabled={!form.field}
      onApply={onApply}
      onCancel={onClose}
      onBack={onBack}
      onRemove={row ? onRemove : undefined}
    >
      <SortForm form={form} fieldOptions={toSelectOptions(sortChipFieldOptions(state, row?.id))} onChange={setForm} />
    </ChipPopupPanel>
  );
};

export default SortPanel;
