'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  moveToolsets,
  removeToolset,
  signInToolset,
  signOutToolset,
  updateToolset,
} from '@/src/app/[lang]/assets-toolsets/actions';
import ResourceAuthButtons from '@/src/components/Assets/Resources/Auth/ResourceAuthButtons';
import { getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import AssetHeader from '@/src/components/EntityHeaderControls/AssetHeader';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useAppContext } from '@/src/context/AppContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import type { CatalogSchemaOptions } from '@/src/server/catalog-schemas/read-options';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { changePath, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';
import TabsContent from './TabsContent';
import { DialToolsetResource } from '@/src/models/dial/resource';

interface Props {
  etag: string;
  oAuthCode?: string | null;
  originalToolset: AssetToolset;
  catalogSchemas?: CatalogSchemaOptions;
}

const ToolsetView: FC<Props> = ({ oAuthCode, etag: initialEtag, originalToolset, catalogSchemas }) => {
  const t = useI18n();
  const { featureFlags } = useAppContext();
  const tabs = getTabsForAsset(t, ApplicationRoute.AssetsToolsets, featureFlags);
  const router = useRouter();
  const { fetchFiles } = useToolsetFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [etag, setEtag] = useState(initialEtag);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedToolset, setSelectedToolset] = useState(structuredClone(originalToolset));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setEtag(initialEtag);
  }, [initialEtag]);

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
    setDiscardKey((prev) => prev + 1);
  }, [originalToolset]);

  const onSave = useCallback(async () => {
    const isNeedToMove = getIsNeedToMove(selectedToolset, originalToolset);
    const updatedEntity = getEntityForUpdate(
      {
        ...selectedToolset,
        name: originalToolset.name,
        path: originalToolset.path,
        version: originalToolset.version,
        _metadata: originalToolset._metadata,
      },
      originalToolset,
    );
    try {
      const res = await getReqRef.current(updateToolset, updatedEntity, etag);
      if (res.etag) {
        setEtag(res.etag);
      }
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.AssetsToolsets, t),
            getUpdateNotificationDescription(
              ApplicationRoute.AssetsToolsets,
              updatedEntity.name || updatedEntity._metadata?.name || '',
              t,
            ),
          ),
        );
        if (isNeedToMove) {
          const originalPath = originalToolset.path || originalToolset._metadata?.path || '';
          const newPath = removeTrailingSlash(selectedToolset.folderId ?? selectedToolset._metadata?.folderId);
          const [moveResult] = await moveToolsets([originalPath], newPath);
          if (!moveResult.success) {
            showNotification(
              getErrorNotification(moveResult.errorHeader, moveResult.errorMessage, moveResult.requestId),
            );
            return;
          }
          await fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
          router.push(
            getUrnForEntity(ApplicationRoute.AssetsToolsets, {
              name: updatedEntity.name || updatedEntity._metadata?.name || '',
              path: changePath(originalPath, newPath),
            }),
          );
        } else {
          fetchFiles(updatedEntity.folderId || updatedEntity._metadata?.folderId || '');
          router.push(getUrnForEntity(ApplicationRoute.AssetsToolsets, updatedEntity));
        }
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    } catch (error) {
      showNotification(getErrorNotification((error as Error).message));
    }
  }, [selectedToolset, originalToolset, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <AssetHeader
        etag={etag}
        view={ApplicationRoute.AssetsToolsets}
        entity={{
          ...selectedToolset,
          folderId: originalToolset.folderId,
          name: originalToolset.name,
          path: originalToolset.path,
          version: originalToolset.version,
          _metadata: originalToolset._metadata,
        }}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeToolset}
        getAssetContext={useToolsetFolder}
      >
        <ResourceAuthButtons
          view={ApplicationRoute.AssetsToolsets}
          selectedToolset={selectedToolset as unknown as DialToolsetResource}
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
            catalogSchemas={catalogSchemas}
            onChange={setSelectedToolset}
          />
        )}
      </div>
    </div>
  );
};

export default ToolsetView;
