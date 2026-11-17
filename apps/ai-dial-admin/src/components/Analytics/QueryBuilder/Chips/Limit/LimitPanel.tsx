'use client';

import { FC, useState } from 'react';

import ChipPopupPanel from '@/src/components/Analytics/QueryBuilder/Chips/ChipPopupPanel';
import LimitForm from '@/src/components/Analytics/QueryBuilder/Chips/Limit/LimitForm';
import { ChipPanelProps } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { isLimitFormValid, toLimitForm, withLimit } from '@/src/components/Analytics/QueryBuilder/Chips/utils/limit';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const LimitPanel: FC<ChipPanelProps> = ({ titleId, onClose }) => {
  const t = useI18n();
  const { state, patch } = useQueryBuilder();
  const [form, setForm] = useState(() => toLimitForm(state.page));

  const onApply = () => {
    patch({ page: withLimit(state.page, form) });
    onClose();
  };

  return (
    <ChipPopupPanel
      titleId={titleId}
      title={t(QueryBuilderI18nKey.Limit)}
      isApplyDisabled={!isLimitFormValid(form)}
      onApply={onApply}
      onCancel={onClose}
    >
      <LimitForm form={form} onChange={setForm} />
    </ChipPopupPanel>
  );
};

export default LimitPanel;
