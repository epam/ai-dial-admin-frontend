import { FC, useMemo } from 'react';

import classNames from 'classnames';

import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TableStatus } from '@/src/models/analytics/table';

interface Props {
  status?: TableStatus;
  className?: string;
}

// Modeled on Common/SyncCoreStatus/CoreSyncStatusBadge, minus its polling/etag/diff-modal machinery —
// table status only changes on the user's own schema submission, so there's nothing to poll for.
const TableStatusBadge: FC<Props> = ({ status, className }) => {
  const t = useI18n();

  const textMapping = useMemo(
    () => ({
      [TableStatus.Pending]: t(AnalyticsTablesI18nKey.StatusPending),
      [TableStatus.Active]: t(AnalyticsTablesI18nKey.StatusActive),
      [TableStatus.Failed]: t(AnalyticsTablesI18nKey.StatusFailed),
    }),
    [t],
  );

  const badgeClassMapping = useMemo(
    () => ({
      [TableStatus.Pending]: 'text-warning bg-warning',
      [TableStatus.Active]: 'text-success bg-success',
      [TableStatus.Failed]: 'text-error bg-error',
    }),
    [],
  );

  if (!status) {
    return null;
  }

  return (
    <div
      className={classNames(
        'flex items-center gap-x-1 py-1 px-2 uppercase dial-caption-text font-semibold rounded-full',
        badgeClassMapping[status],
        className,
      )}
    >
      <span>{textMapping[status]}</span>
    </div>
  );
};

export default TableStatusBadge;
