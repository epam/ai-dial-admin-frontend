import { FC, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialIconButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import { getCoreSyncStatus } from '@/src/app/actions';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { CoreSyncI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { CoreSyncStatus } from '@/src/models/core-sync-status';
import { EntitySyncStatus } from '@/src/types/entity-sync-status';
import { ApplicationRoute } from '@/src/types/routes';
import { getCoreSyncStatusUrl } from '@/src/utils/core-sync/get-core-sync-status-url';
import CoreSyncDiffModal from './DiffModal';
import StatusText from './StatusText';

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
    <div className={classNames(coreSyncStatus?.status ? 'block' : 'hidden')}>
      <LabelledText label={t(CoreSyncI18nKey.SyncWithCore)}>
        <div className="flex flex-row gap-x-2 items-center">
          <div className="flex flex-row gap-x-2 items-center flex-1 min-w-0">
            <StatusText status={coreSyncStatus?.status} />
          </div>
          {diffStatus && (
            <DialIconButton
              icon={<OpenPopup {...BASE_BUTTON_ICON_PROPS} className="cursor-pointer text-secondary" />}
              onClick={() => setIsModalOpen(true)}
              className="w-auto h-auto"
            />
          )}
        </div>
      </LabelledText>
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
    </div>
  );
};

export default CoreSyncEntityStatus;
