'use client';

import { FC, useState } from 'react';

import ChipPopupPanel from '@/src/components/Analytics/QueryBuilder/Chips/ChipPopupPanel';
import { ChipPanelProps, PeriodChipForm, PeriodControl } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import PeriodForm from '@/src/components/Analytics/QueryBuilder/Chips/Period/PeriodForm';
import { QueryChipsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props extends ChipPanelProps {
  period: PeriodControl;
}

const PeriodPanel: FC<Props> = ({ titleId, period, onClose }) => {
  const t = useI18n();
  const [form, setForm] = useState<PeriodChipForm>(() => ({
    period: period.timePeriod,
    isCustom: period.isCustom,
    range: period.isCustom ? period.timeRange : null,
  }));

  const onApply = () => {
    if (form.isCustom && form.range) period.onChangeTimeRange(form.range, true);
    if (!form.isCustom) period.onChangeTimePeriod(form.period);
    onClose();
  };

  return (
    <ChipPopupPanel
      titleId={titleId}
      title={t(QueryChipsI18nKey.Period)}
      isApplyDisabled={form.isCustom && !form.range}
      onApply={onApply}
      onCancel={onClose}
    >
      <PeriodForm form={form} onChange={setForm} />
    </ChipPopupPanel>
  );
};

export default PeriodPanel;
