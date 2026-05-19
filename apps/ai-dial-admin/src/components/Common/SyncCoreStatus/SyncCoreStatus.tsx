import { FC, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import { getCoreSyncStatus } from '@/src/app/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { CoreSyncI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { CoreSyncStatus } from '@/src/models/core-sync-status';
import { EntitySyncStatus } from '@/src/types/entity-sync-status';
import { ApplicationRoute } from '@/src/types/routes';
import { getCoreSyncStatusUrl } from '@/src/utils/core-sync/get-core-sync-status-url';
import CoreSyncDiffModal from './DiffModal';

interface Props {
  view?: ApplicationRoute;
  name?: string;
}

const CoreSyncEntityStatus: FC<Props> = ({ view, name }) => {
  const t = useI18n();
  const { resetCounter } = useSaveValidationContext();
  const [coreSyncStatus, setCoreSyncStatus] = useState<CoreSyncStatus | undefined>();
  const [etag, setEtag] = useState<string>(DEFAULT_ETAG);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const textMapping = useMemo(() => {
    return {
      [EntitySyncStatus.FULLY_SYNCED]: t(CoreSyncI18nKey.Synced),
      [EntitySyncStatus.IN_PROGRESS]: t(CoreSyncI18nKey.InProgress),
      [EntitySyncStatus.IN_PROGRESS_TOO_LONG]: t(CoreSyncI18nKey.Partially),
      [EntitySyncStatus.UNKNOWN]: t(CoreSyncI18nKey.Unknown),
    };
  }, [t]);

  const badgeClassMapping = useMemo(() => {
    return {
      [EntitySyncStatus.FULLY_SYNCED]: 'text-success bg-success',
      [EntitySyncStatus.IN_PROGRESS]: 'text-secondary bg-layer-4',
      [EntitySyncStatus.IN_PROGRESS_TOO_LONG]: 'text-warning bg-warning',
      [EntitySyncStatus.UNKNOWN]: 'text-secondary bg-layer-4',
    };
  }, []);

  const validStatus = useMemo(() => {
    return (
      coreSyncStatus?.status === EntitySyncStatus.IN_PROGRESS_TOO_LONG ||
      coreSyncStatus?.status === EntitySyncStatus.FULLY_SYNCED ||
      coreSyncStatus?.status === EntitySyncStatus.UNKNOWN
    );
  }, [coreSyncStatus?.status]);

  const diffStatus = useMemo(() => {
    return (
      coreSyncStatus?.status === EntitySyncStatus.IN_PROGRESS_TOO_LONG ||
      coreSyncStatus?.status === EntitySyncStatus.IN_PROGRESS
    );
  }, [coreSyncStatus?.status]);

  useEffect(() => {
    if (!name) return;

    let intervalId: NodeJS.Timeout | null = null;

    const fetchStatus = async () => {
      const data = await getCoreSyncStatus(getCoreSyncStatusUrl(view, name), etag);
      setEtag(data?.etag || DEFAULT_ETAG);
      setCoreSyncStatus(data?.response);
    };

    if (!coreSyncStatus) {
      fetchStatus();
    }

    if (!validStatus) {
      intervalId = setInterval(fetchStatus, 60000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [name, view, etag, coreSyncStatus, validStatus]);

  useEffect(() => {
    if (resetCounter) {
      setCoreSyncStatus(void 0);
    }
  }, [resetCounter]);

  return (
    <>
      <div className={classNames(coreSyncStatus?.status ? 'visible' : 'invisible', 'h-[20px]')}>
        <div
          className={classNames(
            'py-1 px-2 uppercase dial-caption-text font-semibold rounded-full',
            badgeClassMapping[coreSyncStatus?.status || EntitySyncStatus.UNKNOWN],
          )}
        >
          {coreSyncStatus?.status ? textMapping[coreSyncStatus.status] : ''}
        </div>
      </div>
      {isModalOpen &&
        createPortal(
          <CoreSyncDiffModal
            isModalOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            view={view}
            name={name}
            etag={etag}
            coreSyncStatus={coreSyncStatus}
            onCoreSyncStatusChange={setCoreSyncStatus}
          />,
          document.body,
        )}
    </>
  );

  //         {diffStatus && (
  //           <DialIconButton
  //             icon={<OpenPopup {...BASE_BUTTON_ICON_PROPS} className="cursor-pointer text-secondary" />}
  //             onClick={() => setIsModalOpen(true)}
  //             className="size-auto"
  //           />
  //         )}
};

export default CoreSyncEntityStatus;
