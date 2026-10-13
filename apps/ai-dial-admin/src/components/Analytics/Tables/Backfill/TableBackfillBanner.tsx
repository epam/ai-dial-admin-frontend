'use client';

import { FC } from 'react';

import {
  Button,
  ButtonVariant,
  ElementSize,
  Notification,
  NotificationType,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';

import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TableBackfillRun } from '@/src/models/analytics/table-backfill';
import { getDaysProgress } from '@/src/utils/analytics/backfill';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  run: TableBackfillRun;
  onOpen: () => void;
}

/**
 * Shown for a running run only: a finished run is reached through the Backfill data button, and a banner for it
 * would never go away. "Day N of M" is a position, not a percentage.
 */
const TableBackfillBanner: FC<Props> = ({ run, onOpen }) => {
  const t = useI18n();

  return (
    <Notification
      variant={NotificationVariant.Info}
      type={NotificationType.SectionMessage}
      role="status"
      title={t(BackfillI18nKey.BannerTable, { day: getDaysProgress(run), total: run.daysTotal })}
      message={t(BackfillI18nKey.BannerTableStarted, { time: formatDateTimeToLocalString(run.startedAt) })}
      action={
        <Button
          variant={ButtonVariant.Secondary}
          size={ElementSize.Small}
          label={t(BackfillI18nKey.ViewRun)}
          onClick={onOpen}
        />
      }
    />
  );
};

export default TableBackfillBanner;
