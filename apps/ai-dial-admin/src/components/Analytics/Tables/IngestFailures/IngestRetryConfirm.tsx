'use client';

import { FC } from 'react';

import RetryConfirmPopup from '@/src/components/Analytics/Common/Failures/RetryConfirmPopup';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  count?: number | null;
  isDeterministic: boolean;
  runId?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const IngestRetryConfirm: FC<Props> = ({ count, isDeterministic, runId, onConfirm, onClose }) => {
  const t = useI18n();

  const title =
    typeof count === 'number'
      ? t(IngestFailuresI18nKey.ConfirmTitle, { count })
      : t(IngestFailuresI18nKey.ConfirmTitleUnknown);

  const caveats = [
    count === null ? t(IngestFailuresI18nKey.ConfirmReach) : null,
    runId ? t(IngestFailuresI18nKey.ConfirmRun, { id: runId }) : null,
    isDeterministic ? t(IngestFailuresI18nKey.DeterministicCaveat) : null,
  ].filter(Boolean) as string[];

  return (
    <RetryConfirmPopup
      title={title}
      body={t(IngestFailuresI18nKey.ConfirmBody)}
      caveats={caveats}
      confirmLabel={t(IngestFailuresI18nKey.Retry)}
      isConfirmDisabled={count === undefined}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
};

export default IngestRetryConfirm;
