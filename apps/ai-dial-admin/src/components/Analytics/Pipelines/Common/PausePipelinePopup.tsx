'use client';

import { FC } from 'react';

import { ConfirmationPopupVariant, ConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  name: string;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * The informational variant, not the danger one: a pause is reversible, and the header already reserves
 * the danger treatment for Delete.
 *
 * The last line is the consequence an operator cannot discover from the console. The runner holds its
 * pauses in memory, in one replica, so a deployment clears them — and without that sentence the first
 * time anyone learns it is from a pipeline that resumed itself overnight.
 */
const PausePipelinePopup: FC<Props> = ({ name, onConfirm, onClose }) => {
  const t = useI18n();

  return (
    <ConfirmationPopup
      open
      variant={ConfirmationPopupVariant.Info}
      header={t(AnalyticsPipelinesI18nKey.PauseConfirmTitle)}
      description={
        <div className="flex flex-col gap-y-2">
          <span>{t(AnalyticsPipelinesI18nKey.PauseConfirmBody, { name })}</span>
          <span className="text-secondary">{t(AnalyticsPipelinesI18nKey.PauseConfirmRuntimeAction)}</span>
          <span className="text-secondary">{t(AnalyticsPipelinesI18nKey.PauseConfirmRestart)}</span>
        </div>
      }
      confirmLabel={t(AnalyticsPipelinesI18nKey.Pause)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
};

export default PausePipelinePopup;
