'use client';

import { FC, useState } from 'react';

import AggregateForm from '@/src/components/Analytics/QueryBuilder/Chips/Aggregate/AggregateForm';
import ChipPopupPanel from '@/src/components/Analytics/QueryBuilder/Chips/ChipPopupPanel';
import { ChipPanelProps } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import {
  createAggregateForm,
  hasAggregate,
  isAggregateFormValid,
  toAggregateForm,
  withAggregate,
  withoutAggregate,
} from '@/src/components/Analytics/QueryBuilder/Chips/utils/aggregate';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const AggregatePanel: FC<ChipPanelProps> = ({ titleId, onClose, onBack }) => {
  const t = useI18n();
  const { state, patch } = useQueryBuilder();
  const isEditing = hasAggregate(state);
  const [form, setForm] = useState(() => (isEditing ? toAggregateForm(state) : createAggregateForm(state.functions)));

  const onApply = () => {
    patch(withAggregate(state, form));
    onClose();
  };

  const onRemove = () => {
    patch(withoutAggregate(state));
    onClose();
  };

  return (
    <ChipPopupPanel
      titleId={titleId}
      title={t(isEditing ? QueryBuilderI18nKey.Aggregate : QueryChipsI18nKey.AddAggregate)}
      isApplyDisabled={!isAggregateFormValid(form, state.fields, state.functions)}
      onApply={onApply}
      onCancel={onClose}
      onBack={onBack}
      onRemove={isEditing ? onRemove : undefined}
    >
      <AggregateForm form={form} fields={state.fields} functions={state.functions} onChange={setForm} />
    </ChipPopupPanel>
  );
};

export default AggregatePanel;
