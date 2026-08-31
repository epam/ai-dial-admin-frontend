'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removeRole, updateRole } from '@/src/app/[lang]/platform-roles/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useRolesFolder } from '@/src/context/assets/RolesFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialRoleResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalRole: DialRoleResource;
}

const RoleAssetView: FC<Props> = ({ etag, originalRole }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.PlatformRoles);
  const router = useRouter();
  const { fetchFiles } = useRolesFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRole, setSelectedRole] = useState(structuredClone(originalRole));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(true);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setSelectedRole(structuredClone(originalRole));
  }, [originalRole]);

  useEffect(() => {
    if (Object.keys(selectedRole).length && originalRole) {
      setIsChanged(!isEqualSkippingUndefined(originalRole, selectedRole));
    }
  }, [selectedRole, originalRole]);

  const onDiscard = useCallback(() => {
    setIsSkipRefresh(false);
    setSelectedRole(structuredClone(originalRole));
    setDiscardKey((prev) => prev + 1);
  }, [originalRole]);

  const onChangeRole = useCallback((role: DialRoleResource, skipRefresh?: boolean) => {
    setSelectedRole(role);
    setIsSkipRefresh(!!skipRefresh);
  }, []);

  const onSave = useCallback(() => {
    getReqRef.current(updateRole, selectedRole, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.PlatformRoles, t),
            getUpdateNotificationDescription(ApplicationRoute.PlatformRoles, selectedRole.name, t),
          ),
        );
        fetchFiles(selectedRole.folderId);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedRole, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.PlatformRoles}
        entity={selectedRole}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeRole}
        getAssetContext={useRolesFolder}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedRole}
            setSelectedEntity={setSelectedRole}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            activeTab={activeTab}
            selectedRole={selectedRole}
            isSkipRefresh={isSkipRefresh}
            onChange={onChangeRole}
          />
        )}
      </div>
    </div>
  );
};

export default RoleAssetView;
