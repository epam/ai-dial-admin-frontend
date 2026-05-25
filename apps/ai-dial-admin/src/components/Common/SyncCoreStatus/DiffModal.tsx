import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react';

import { DialLoader, DialPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { IconCircleCheck } from '@tabler/icons-react';

import { getCoreSyncStatus } from '@/src/app/actions';
import JsonView from '@/src/components/Common/JsonView/JsonView';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { CoreSyncI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { CoreSyncStatus } from '@/src/models/core-sync-status';
import { EntitySyncStatus } from '@/src/types/entity-sync-status';
import { ApplicationRoute } from '@/src/types/routes';
import { getCoreSyncStatusUrl } from '@/src/utils/core-sync/get-core-sync-status-url';
import CoreSyncStatusBadge from './CoreSyncStatusBadge';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  view?: ApplicationRoute;
  name?: string;
  etag: string;
  coreSyncStatus?: CoreSyncStatus;
  onCoreSyncStatusChange?: Dispatch<SetStateAction<CoreSyncStatus | undefined>>;
}

const CoreSyncDiffModal: FC<Props> = ({
  isModalOpen,
  onClose,
  view,
  name,
  etag,
  coreSyncStatus,
  onCoreSyncStatusChange,
}) => {
  const t = useI18n();

  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<CoreSyncStatus | undefined>();

  const size = useMemo(() => {
    return newStatus?.status === EntitySyncStatus.FULLY_SYNCED ? PopupSize.Sm : PopupSize.Lg;
  }, [newStatus?.status]);

  useEffect(() => {
    setLoading(true);
    getCoreSyncStatus(getCoreSyncStatusUrl(view, name), etag).then((data) => {
      setNewStatus(data?.response);
      setLoading(false);
      if (coreSyncStatus?.status !== data?.response?.status) {
        onCoreSyncStatusChange?.((prev) => ({
          ...prev,
          status: data?.response?.status,
        }));
      }
    });
  }, [coreSyncStatus, etag, name, onCoreSyncStatusChange, view]);

  return (
    <DialPopup
      onClose={onClose}
      header={t(CoreSyncI18nKey.SyncWithCore)}
      portalId="SyncWithCore"
      open={isModalOpen}
      size={size}
      dividers={!(newStatus?.status === EntitySyncStatus.FULLY_SYNCED)}
    >
      <div className="h-full px-6 py-4">
        {loading ? (
          <DialLoader />
        ) : newStatus?.status === EntitySyncStatus.FULLY_SYNCED ? (
          <div className="flex flex-col gap-y-2 items-center justify-center h-[250px] pb-7">
            <IconCircleCheck stroke={1} size={60} className="text-secondary" />
            <div className="text-sm">{t(CoreSyncI18nKey.Fully)}</div>
          </div>
        ) : (
          <div className="flex flex-col h-[80vh] flex-1">
            <div className="flex flex-row gap-x-10">
              <LabelledText label={t(CoreSyncI18nKey.SyncStatus)}>
                <div className="flex flex-row gap-x-2 items-center">
                  <CoreSyncStatusBadge status={newStatus?.status} />
                </div>
              </LabelledText>
              <LabelledText label={t(CoreSyncI18nKey.Format)}>{t(CoreSyncI18nKey.Core)}</LabelledText>
            </div>
            <JsonView
              modified={JSON.stringify(coreSyncStatus?.configState || {}, null, 2)}
              original={JSON.stringify(coreSyncStatus?.currentState || {}, null, 2)}
              leftTitle={t(CoreSyncI18nKey.Admin)}
              rightTitle={t(CoreSyncI18nKey.Core)}
              containerClassName="mt-6"
            />
          </div>
        )}
      </div>
    </DialPopup>
  );
};

export default CoreSyncDiffModal;
