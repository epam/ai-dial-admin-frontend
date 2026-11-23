'use client';

import { FC, useState } from 'react';

import ChipPopupPanel from '@/src/components/Analytics/QueryBuilder/Chips/ChipPopupPanel';
import FilterForm from '@/src/components/Analytics/QueryBuilder/Chips/Filter/FilterForm';
import { ChipPanelProps } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import {
  createFilterForm,
  isFilterFormValid,
  toFilterForm,
  toFilterPredicate,
} from '@/src/components/Analytics/QueryBuilder/Chips/utils/filter';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FilterPredicateNode } from '@/src/models/analytics/query-builder';

interface Props extends ChipPanelProps {
  predicate?: FilterPredicateNode;
}

const FilterPanel: FC<Props> = ({ titleId, predicate, onClose, onBack }) => {
  const t = useI18n();
  const { state, patch } = useQueryBuilder();
  const [form, setForm] = useState(() => (predicate ? toFilterForm(predicate) : createFilterForm()));

  const onChangeChildren = (children: typeof state.filter.children) => {
    patch({ filter: { ...state.filter, children } });
    onClose();
  };

  const onApply = () => {
    const next = toFilterPredicate(form, state.fields, predicate?.id);
    onChangeChildren(
      predicate
        ? state.filter.children.map((child) => (child.id === predicate.id ? next : child))
        : [...state.filter.children, next],
    );
  };

  const onRemove = () => onChangeChildren(state.filter.children.filter((child) => child.id !== predicate?.id));

  return (
    <ChipPopupPanel
      titleId={titleId}
      title={t(predicate ? QueryBuilderI18nKey.Filter : QueryChipsI18nKey.AddFilter)}
      isApplyDisabled={!isFilterFormValid(form, state.fields)}
      onApply={onApply}
      onCancel={onClose}
      onBack={onBack}
      onRemove={predicate ? onRemove : undefined}
    >
      <FilterForm form={form} fields={state.fields} onChange={setForm} />
    </ChipPopupPanel>
  );
};

export default FilterPanel;
