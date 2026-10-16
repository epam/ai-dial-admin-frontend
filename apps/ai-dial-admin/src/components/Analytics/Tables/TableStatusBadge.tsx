import { FC, useMemo } from 'react';

import StatusPill from '@/src/components/Analytics/Common/StatusPill';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TableStatus } from '@/src/models/analytics/table';

interface Props {
  status?: TableStatus;
  className?: string;
}

// Table status only changes on the user's own schema submission, so there's nothing to poll for.
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

  return <StatusPill label={textMapping[status]} toneClassName={badgeClassMapping[status]} className={className} />;
};

export default TableStatusBadge;
