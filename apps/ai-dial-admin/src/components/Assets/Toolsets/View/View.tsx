'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createToolset,
  getToolsets,
  moveToolsets,
  removeToolset,
  signInToolset,
  signOutToolset,
  updateToolset,
} from '@/src/app/[lang]/assets-toolsets/actions';
import ResourceAuthButtons from '@/src/components/Assets/Resources/Auth/ResourceAuthButtons';
import { addNewVersion, getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import AssetHeader from '@/src/components/EntityHeaderControls/AssetHeader';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useAppContext } from '@/src/context/AppContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { Asset, AssetToolset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { changePath, getListOfPathsToMove, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';
import TabsContent from './TabsContent';
import { ServerActionResponse } from '@/src/models/server-action';
import { DialToolsetResource } from '@/src/models/dial/resource';

interface Props {
  etag: string;
  oAuthCode?: string | null;
  originalToolset: AssetToolset;
  toolsets: AssetToolset[];
}

const ToolsetView: FC<Props> = ({ oAuthCode, etag, originalToolset, toolsets }) => {
  const t = useI18n();
  const { featureFlags } = useAppContext();
  const tabs = getTabsForAsset(t, ApplicationRoute.AssetsToolsets, featureFlags);
  const router = useRouter();
  const { fetchFiles } = useToolsetFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedToolset, setSelectedToolset] = useState(structuredClone(originalToolset));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);

  const [addedVersions, setAddedVersions] = useState<string[]>([]);
  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setSelectedToolset(structuredClone(originalToolset));
  }, [originalToolset]);

  useEffect(() => {
    if (Object.keys(selectedToolset).length && originalToolset) {
      setIsChanged(!isEqualSkippingUndefined(originalToolset, selectedToolset));
    }
  }, [selectedToolset, originalToolset]);

  const onDiscard = useCallback(() => {
    setSelectedToolset(structuredClone(originalToolset));
    setAddedVersions([]);
    setDiscardKey((prev) => prev + 1);
  }, [originalToolset]);

  const onSave = useCallback(
    (newVersion?: string) => {
      const isNeedToMove = getIsNeedToMove(selectedToolset, originalToolset);
      let updatedEntity = getEntityForUpdate(selectedToolset, originalToolset);
      let updateFunction = updateToolset;
      if (newVersion) {
        updatedEntity = { ...addNewVersion(updatedEntity, newVersion), auth_settings: {} } as unknown as AssetToolset;
        updateFunction = createToolset as (
          asset: AssetToolset,
        ) => Promise<ServerActionResponse<Record<string, unknown>>>;
      }
      getReqRef.current(updateFunction, updatedEntity, etag).then((res) => {
        if (res.success) {
          setAddedVersions([]);
          showNotification(
            getSuccessNotification(
              newVersion
                ? getCreateNotificationTitle(ApplicationRoute.AssetsToolsets, t)
                : getUpdateNotificationTitle(ApplicationRoute.AssetsToolsets, t),
              newVersion
                ? getCreateNotificationDescription(ApplicationRoute.AssetsToolsets, updatedEntity.name, t)
                : getUpdateNotificationDescription(ApplicationRoute.AssetsToolsets, updatedEntity.name, t),
            ),
          );
          if (isNeedToMove) {
            getToolsets(addTrailingSlash(updatedEntity.folderId)).then((toolsets) => {
              const pathsToMove = getListOfPathsToMove(updatedEntity, null, (toolsets as AssetToolset[]) || []);
              const newPath = removeTrailingSlash(selectedToolset.folderId);
              moveToolsets(pathsToMove, newPath).then(() => {
                fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
                router.push(
                  getUrnForEntity(ApplicationRoute.AssetsToolsets, {
                    name: updatedEntity.name,
                    path: changePath(updatedEntity.path, newPath),
                  }),
                );
              });
            });
          } else {
            fetchFiles(updatedEntity.folderId);
            router.push(getUrnForEntity(ApplicationRoute.AssetsToolsets, updatedEntity));
          }
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [selectedToolset, originalToolset, etag, showNotification, t, router, fetchFiles],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <AssetHeader
        etag={etag}
        view={ApplicationRoute.AssetsToolsets}
        entity={selectedToolset}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        assets={toolsets || []}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeToolset}
        getAssetContext={useToolsetFolder}
        onChangeAsset={setSelectedToolset as (asset: Asset) => void}
        addedVersions={addedVersions}
        onChangeAddedVersion={setAddedVersions}
      >
        <ResourceAuthButtons
          view={ApplicationRoute.AssetsToolsets}
          selectedToolset={selectedToolset as DialToolsetResource}
          signInToolset={signInToolset}
          signOutToolset={signOutToolset}
          oAuthCode={oAuthCode}
        />
      </AssetHeader>

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedToolset}
            setSelectedEntity={setSelectedToolset}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            key={discardKey}
            activeTab={activeTab}
            selectedToolset={selectedToolset}
            originalToolset={originalToolset}
            onChange={setSelectedToolset}
          />
        )}
      </div>
    </div>
  );
};

export default ToolsetView;
