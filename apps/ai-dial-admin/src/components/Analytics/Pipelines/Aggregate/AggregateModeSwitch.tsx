'use client';
import { FC } from 'react';
import {
  ConfirmationPopup,
  ConfirmationPopupVariant,
  RadioGroup,
  RadioGroupItem,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';
import { AggregateMode } from '@/src/components/Analytics/Pipelines/Aggregate/models';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
interface Props {
  mode: AggregateMode;
  isConfirmOpen: boolean;
  onChange: (mode: AggregateMode) => void;
  onConfirm: () => void;
  onCancel: () => void;
}
const AggregateModeSwitch: FC<Props> = ({ mode, isConfirmOpen, onChange, onConfirm, onCancel }) => {
  const t = useI18n();
  const items: RadioGroupItem[] = [
    { value: AggregateMode.Form, label: t(AnalyticsPipelinesI18nKey.AggregateModeForm) },
    { value: AggregateMode.Sql, label: t(AnalyticsPipelinesI18nKey.AggregateModeSql) },
  ];
  return (
    <>
      <RadioGroup
        id="aggregate-mode"
        labelProps={{ label: t(AnalyticsPipelinesI18nKey.AggregateMode) }}
        orientation={RadioGroupOrientation.Row}
        items={items}
        value={mode}
        onChange={(next) => onChange(next as AggregateMode)}
      />
      {isConfirmOpen && (
        <ConfirmationPopup
          open
          variant={ConfirmationPopupVariant.Info}
          header={t(AnalyticsPipelinesI18nKey.AggregateModeSwitchTitle)}
          description={t(AnalyticsPipelinesI18nKey.AggregateModeSwitchBody)}
          confirmLabel={t(AnalyticsPipelinesI18nKey.AggregateModeSwitchConfirm)}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          onConfirm={onConfirm}
          onClose={onCancel}
        />
      )}
    </>
  );
};
export default AggregateModeSwitch;
