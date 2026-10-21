import { FC } from 'react';

import StatusPill from '@/src/components/Analytics/Common/StatusPill';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BackfillStatus } from '@/src/models/analytics/backfill-ui';

interface Props {
  status: BackfillStatus;
  className?: string;
}

const LABEL: Record<BackfillStatus, BackfillI18nKey> = {
  [BackfillStatus.Running]: BackfillI18nKey.StatusRunning,
  [BackfillStatus.Paused]: BackfillI18nKey.StatusPaused,
  [BackfillStatus.Done]: BackfillI18nKey.StatusDone,
  [BackfillStatus.Queued]: BackfillI18nKey.StatusQueued,
  [BackfillStatus.Cancelled]: BackfillI18nKey.StatusCancelled,
  [BackfillStatus.Failed]: BackfillI18nKey.StatusFailed,
};

// Queued is a finished run whose groups are still to be evaluated, so it takes the info tone of work in
// progress rather than the success tone of work completed.
const TONE: Record<BackfillStatus, string> = {
  [BackfillStatus.Running]: 'text-info bg-info',
  [BackfillStatus.Paused]: 'text-warning bg-warning',
  [BackfillStatus.Done]: 'text-success bg-success',
  [BackfillStatus.Queued]: 'text-info bg-info',
  [BackfillStatus.Cancelled]: 'text-secondary bg-layer-3',
  [BackfillStatus.Failed]: 'text-error bg-error',
};

const BackfillStatusBadge: FC<Props> = ({ status, className }) => {
  const t = useI18n();

  return <StatusPill label={t(LABEL[status])} toneClassName={TONE[status]} className={className} />;
};

export default BackfillStatusBadge;
