'use client';

import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removeKey, rotateKey, updateKey } from '@/src/app/[lang]/platform-keys/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useKeysFolder } from '@/src/context/assets/KeysFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialKeyResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import KeyRotateModal from './KeyRotateModal';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalKey: DialKeyResource;
  roles: DialRole[];
}

const KeyAssetView: FC<Props> = ({ etag, originalKey, roles }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.PlatformKeys);
  const router = useRouter();
  const { fetchFiles } = useKeysFolder();
  const { showNotification } = useNotification();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedKey, setSelectedKey] = useState(structuredClone(originalKey));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setSelectedKey(structuredClone(originalKey));
  }, [originalKey]);

  useEffect(() => {
    if (Object.keys(selectedKey).length && originalKey) {
      setIsChanged(!isEqualSkippingUndefined(originalKey, selectedKey));
    }
  }, [selectedKey, originalKey]);

  const onDiscard = useCallback(() => {
    setSelectedKey(structuredClone(originalKey));
    setDiscardKey((prev) => prev + 1);
  }, [originalKey]);

  const onSave = useCallback(() => {
    getReqRef.current(updateKey, selectedKey, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.PlatformKeys, t),
            getUpdateNotificationDescription(ApplicationRoute.PlatformKeys, selectedKey.name, t),
          ),
        );
        fetchFiles(selectedKey.folderId);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedKey, etag, showNotification, t, router, fetchFiles]);

  const onRotate = useCallback(
    async (keyWithSecret: DialKeyResource, currentEtag: string) => {
      const res = await rotateKey(keyWithSecret, currentEtag);
      if (res.success) {
        fetchFiles(keyWithSecret.folderId);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
      return res;
    },
    [fetchFiles, router, showNotification],
  );

  const rotateButton = !isReadOnlyAdmin && (
    <DialPrimaryButton
      label={t(ButtonsI18nKey.Rotate)}
      iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
      onClick={() => setIsRotateModalOpen(true)}
    />
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.PlatformKeys}
        entity={selectedKey}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeKey}
        getAssetContext={useKeysFolder}
      >
        {rotateButton}
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
            activeTab={activeTab}
            selectedKey={selectedKey}
            originalKey={originalKey}
            roles={roles}
            onChange={setSelectedKey}
          />
        )}
      </div>

      <KeyRotateModal
        isOpen={isRotateModalOpen}
        asset={selectedKey}
        etag={etag}
        onRotate={onRotate}
        onClose={() => setIsRotateModalOpen(false)}
      />
    </div>
  );
};

export default KeyAssetView;
