'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cloneDeep } from 'lodash';

import {
  createToolset,
  getToolsets,
  moveToolsets,
  removeToolset,
  updateToolset,
} from '@/src/app/[lang]/assets-toolsets/actions';
import { addNewVersion, getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import AssetHeader from '@/src/components/EntityHeaderControls/AssetHeader';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import AuthButtons from '@/src/components/Toolsets/Auth/AuthButtons';
import { ROOT_FOLDER } from '@/src/constants/file';
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
import DiscardModal from '@/src/components//EntityView/Modals/Discard/Discard';

interface Props {
  etag: string;
  oAuthCode?: string | null;
  originalToolset: AssetToolset;
  toolsets: AssetToolset[];
}

const ToolsetView: FC<Props> = ({ oAuthCode, etag, originalToolset, toolsets }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.AssetsToolsets);
  const router = useRouter();
  const { fetchFiles } = useToolsetFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedToolset, setSelectedToolset] = useState(cloneDeep(originalToolset));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setSelectedToolset(cloneDeep(originalToolset));
  }, [originalToolset]);

  useEffect(() => {
    if (Object.keys(selectedToolset).length && originalToolset) {
      setIsChanged(!isEqualSkippingUndefined(originalToolset, selectedToolset));
    }
  }, [selectedToolset, originalToolset]);

  const onDiscard = useCallback(() => {
    setSelectedToolset(cloneDeep(originalToolset));
  }, [originalToolset]);

  const onSave = useCallback(
    (newVersion?: string) => {
      const isNeedToMove = getIsNeedToMove(selectedToolset, originalToolset);
      let updatedEntity = getEntityForUpdate(selectedToolset, originalToolset);
      let updateFunction = updateToolset;
      if (newVersion) {
        updatedEntity = addNewVersion(updatedEntity, newVersion);
        updateFunction = createToolset;
      }
      getReqRef.current(updateFunction, updatedEntity, etag).then((res) => {
        if (res.success) {
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
              const pathsToMove = getListOfPathsToMove(updatedEntity, null, toolsets || []);
              const newPath = removeTrailingSlash(selectedToolset.folderId);
              moveToolsets(pathsToMove, newPath).then((r) => {
                if (r.every((response) => response.success)) {
                  router.push(
                    getUrnForEntity(ApplicationRoute.AssetsToolsets, {
                      name: updatedEntity.name,
                      path: changePath(updatedEntity.path, newPath),
                    }),
                  );
                  fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
                }
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

  const onRemove = useCallback(
    (entity: string) => {
      return removeToolset(entity, etag);
    },
    [etag],
  );

  const onTryToDiscard = useCallback(() => {
    setIsDiscardModalOpen(true);
  }, []);

  const onDiscardModalConfirm = useCallback(() => {
    onDiscard();
    setIsDiscardModalOpen(false);
  }, [onDiscard]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <AssetHeader
        view={ApplicationRoute.AssetsToolsets}
        entity={selectedToolset}
        isChanged={isChanged}
        onDiscard={onTryToDiscard}
        onSave={onSave}
        tabs={tabs}
        assets={toolsets || []}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={onRemove}
        getAssetContext={useToolsetFolder}
        onChangeAsset={setSelectedToolset as (asset: Asset) => void}
      >
        <AuthButtons view={ApplicationRoute.AssetsToolsets} selectedToolset={selectedToolset} oAuthCode={oAuthCode} />
      </AssetHeader>

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            entity={selectedToolset}
            setSelectedEntity={setSelectedToolset}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            <TabsContent
              activeTab={activeTab}
              selectedToolset={selectedToolset}
              originalToolset={originalToolset}
              onChange={setSelectedToolset}
            />
            {isDiscardModalOpen && (
              <DiscardModal
                onConfirm={onDiscardModalConfirm}
                onClose={() => setIsDiscardModalOpen(false)}
                onCancel={() => setIsDiscardModalOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ToolsetView;
