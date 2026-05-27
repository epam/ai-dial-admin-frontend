'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialConfirmationPopup, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';
import { cloneDeep } from 'lodash';

import { getCoreKey, removeKey, updateCoreKey, updateKey } from '@/src/app/[lang]/keys/actions';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ButtonsI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { DialRole } from '@/src/models/dial/role';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getKeyTabs } from '@/src/utils/tabs/utils';
import KeyRotateModal from '../Modals/KeyRotateModal';
import TabsContent from './TabsContent';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';

interface Props {
  originalKey: DialKey;
  names: string[];
  keys: string[];
  etag: string;
  roles: DialRole[];
}

const KeyView: FC<Props> = ({ originalKey, etag, ...props }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const router = useRouter();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());
  const tabs = getKeyTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(cloneDeep(originalKey));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);

  const [selectedFormat, setSelectedFormat] = useState(ExportFormat.ADMIN);
  const [coreKey, setCoreKey] = useState<DialKey | null>(null);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      selectedFormat,
      onChangeSelectedFormat: setSelectedFormat,
      onToggleEditor: () => {
        setSelectedFormat(ExportFormat.ADMIN);

        setIsEditorEnabled((prev) => !prev);
      },
    }),
    [isEditorEnabled, selectedFormat],
  );

  useEffect(() => {
    const name = originalKey?.name;
    if (!coreKey && name) {
      getReqRef.current(getCoreKey, name).then((data) => {
        setCoreKey(data.response);
      });
    }
  }, [coreKey, originalKey]);

  useEffect(() => {
    setSelectedKey(selectedFormat === ExportFormat.CORE ? cloneDeep(coreKey as DialKey) : cloneDeep(originalKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalKey]);

  useEffect(() => {
    const isEqualAdminKey = isEqualSkippingUndefined(originalKey, selectedKey);
    const isEqualCoreKey = isEqualSkippingUndefined(selectedKey, coreKey);

    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreKey : !isEqualAdminKey);
  }, [selectedFormat, originalKey, selectedKey, coreKey]);

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      setSelectedFormat(ExportFormat.ADMIN);
    }
    setSelectedKey(cloneDeep(originalKey));
    setDiscardKey((prev) => prev + 1);
  }, [isEditorEnabled, originalKey]);

  const onSaveKey = useCallback(() => {
    setIsOpenConfirmModal(false);
    const req =
      selectedFormat === ExportFormat.CORE
        ? getReqRef.current(updateCoreKey, selectedKey as Record<string, unknown>, originalKey.name || '', etag)
        : getReqRef.current(updateKey, selectedKey, etag);

    req.then((res) => {
      if (res.success) {
        setCoreKey(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Keys, t),
            getUpdateNotificationDescription(ApplicationRoute.Keys, selectedKey.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedFormat, selectedKey, originalKey.name, etag, showNotification, t, router]);

  const onRotateKey = useCallback(
    (key: DialKey) => {
      setIsRotateModalOpen(false);
      getReqRef.current(updateKey, key, etag).then((res) => {
        if (res.success) {
          router.refresh();
          showNotification(
            getSuccessNotification(t(KeysI18nKey.RotateKeySuccessTitle), t(KeysI18nKey.RotateKeySuccessDescription)),
          );
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [router, showNotification, t, etag],
  );

  const onTryToSaveKey = useCallback(() => {
    if ((selectedKey?.roles == null || selectedKey.roles.length === 0) && selectedFormat !== ExportFormat.CORE) {
      setIsOpenConfirmModal(true);
    } else {
      onSaveKey();
    }
  }, [selectedKey, selectedFormat, onSaveKey]);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <SimpleEntityHeader
          view={ApplicationRoute.Keys}
          entity={selectedKey}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onTryToSaveKey}
          tabs={tabs}
          jsonConfiguration={jsonConfiguration}
          activeTab={activeTab}
          onChangeActiveTab={setActiveTab}
          onRemove={removeKey}
        >
          {!isReadOnlyAdmin && (
            <DialPrimaryButton
              label={t(ButtonsI18nKey.Rotate)}
              iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} />}
              onClick={() => setIsRotateModalOpen(true)}
            />
          )}
        </SimpleEntityHeader>
        <div className="flex-1 overflow-auto min-h-0">
          {isEditorEnabled ? (
            <EntityJsonEditor
              key={discardKey}
              entity={selectedKey}
              setSelectedEntity={setSelectedKey}
              setIsChanged={setIsChanged}
            />
          ) : (
            <TabsContent
              selectedFormat={selectedFormat}
              activeTab={activeTab}
              selectedKey={selectedKey}
              onChange={setSelectedKey}
              originalKey={originalKey}
              {...props}
            />
          )}
        </div>
      </div>

      {isOpenConfirmModal &&
        createPortal(
          <DialConfirmationPopup
            open={isOpenConfirmModal}
            description={t(KeysI18nKey.SaveWithoutRolesDescriptions)}
            header={t(KeysI18nKey.SaveWithoutRoles)}
            onConfirm={() => onSaveKey()}
            onClose={() => setIsOpenConfirmModal(false)}
            confirmLabel={t(ButtonsI18nKey.Save)}
            cancelLabel={t(ButtonsI18nKey.ContinueEditing)}
          />,
          document.body,
        )}

      {isRotateModalOpen &&
        createPortal(
          <KeyRotateModal
            isModalOpen={isRotateModalOpen}
            selectedKey={selectedKey}
            keys={props.keys}
            onConfirm={(key) => onRotateKey(key)}
            onClose={() => setIsRotateModalOpen(false)}
          />,
          document.body,
        )}
    </>
  );
};

export default KeyView;
