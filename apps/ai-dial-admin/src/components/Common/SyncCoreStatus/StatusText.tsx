import { FC } from 'react';

import { DialLoader, DialTooltip } from '@epam/ai-dial-ui-kit';

import { CoreSyncI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitySyncStatus } from '@/src/types/entity-sync-status';

interface Props {
  status?: EntitySyncStatus;
}

const StatusText: FC<Props> = ({ status }) => {
  const t = useI18n();

  return (
    <>
      {status === EntitySyncStatus.FULLY_SYNCED && (
        <>
          <div className="w-[10px] h-[10px] rounded-full bg-accent-secondary"></div>
          <DialTooltip tooltip={t(CoreSyncI18nKey.Synced)}>
            <span>{t(CoreSyncI18nKey.Synced)}</span>
          </DialTooltip>
        </>
      )}
      {status === EntitySyncStatus.IN_PROGRESS && (
        <>
          <DialLoader size={12} className="w-2 h-2" />
          <span className="whitespace-nowrap">{t(CoreSyncI18nKey.InProgress)}</span>
        </>
      )}
      {status === EntitySyncStatus.IN_PROGRESS_TOO_LONG && (
        <>
          <div className="w-[10px] h-[10px] rounded-full bg-orange-400"></div>
          <DialTooltip tooltip={t(CoreSyncI18nKey.Partially)}>
            <span>{t(CoreSyncI18nKey.Partially)}</span>
          </DialTooltip>
        </>
      )}
      {status === EntitySyncStatus.UNKNOWN && (
        <>
          <div className="w-[10px] h-[10px] rounded-full bg-secondary"></div>
          <DialTooltip tooltip={t(CoreSyncI18nKey.Unknown)}>
            <span>{t(CoreSyncI18nKey.Unknown)}</span>
          </DialTooltip>
        </>
      )}
    </>
  );
};

export default StatusText;
