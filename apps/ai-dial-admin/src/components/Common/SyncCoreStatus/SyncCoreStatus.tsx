import { FC, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import { getCoreSyncStatus } from '@/src/app/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { CoreSyncStatus } from '@/src/models/core-sync-status';
import { EntitySyncStatus } from '@/src/types/entity-sync-status';
import { ApplicationRoute } from '@/src/types/routes';
import { getCoreSyncStatusUrl } from '@/src/utils/core-sync/get-core-sync-status-url';
import CoreSyncBadge from './CoreSyncBadge';
import CoreSyncDiffModal from './DiffModal';

interface Props {
  view?: ApplicationRoute;
  name?: string;
}

const CoreSyncEntityStatus: FC<Props> = ({ view, name }) => {
  const { resetCounter } = useSaveValidationContext();
  const [coreSyncStatus, setCoreSyncStatus] = useState<CoreSyncStatus | undefined>();
  const [etag, setEtag] = useState<string>(DEFAULT_ETAG);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const validStatus = useMemo(() => {
    return (
      coreSyncStatus?.status === EntitySyncStatus.IN_PROGRESS_TOO_LONG ||
      coreSyncStatus?.status === EntitySyncStatus.FULLY_SYNCED ||
      coreSyncStatus?.status === EntitySyncStatus.UNKNOWN
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
      <div className={classNames(coreSyncStatus?.status ? 'visible' : 'invisible', 'h-6 flex items-center')}>
        <CoreSyncBadge status={coreSyncStatus?.status} onDiffClick={() => setIsModalOpen(true)} />
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
};

export default CoreSyncEntityStatus;
