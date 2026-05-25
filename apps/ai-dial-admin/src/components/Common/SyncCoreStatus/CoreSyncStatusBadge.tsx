import { FC, useMemo } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { CoreSyncI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitySyncStatus } from '@/src/types/entity-sync-status';

interface Props {
  status?: EntitySyncStatus;
  className?: string;
}

const CoreSyncStatusBadge: FC<Props> = ({ status, className }) => {
  const t = useI18n();

  const textMapping = useMemo(
    () => ({
      [EntitySyncStatus.FULLY_SYNCED]: t(CoreSyncI18nKey.Synced),
      [EntitySyncStatus.IN_PROGRESS]: t(CoreSyncI18nKey.InProgress),
      [EntitySyncStatus.IN_PROGRESS_TOO_LONG]: t(CoreSyncI18nKey.Partially),
      [EntitySyncStatus.UNKNOWN]: t(CoreSyncI18nKey.Unknown),
    }),
    [t],
  );

  const badgeClassMapping = useMemo(
    () => ({
      [EntitySyncStatus.FULLY_SYNCED]: 'text-success bg-success',
      [EntitySyncStatus.IN_PROGRESS]: 'text-warning bg-warning',
      [EntitySyncStatus.IN_PROGRESS_TOO_LONG]: 'text-error bg-error',
      [EntitySyncStatus.UNKNOWN]: 'text-secondary bg-layer-4',
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
      {status === EntitySyncStatus.IN_PROGRESS && <DialLoader size={12} className="size-2 mx-1" fullWidth={false} />}
      <span>{textMapping[status]}</span>
    </div>
  );
};

export default CoreSyncStatusBadge;
