'use client';

import { useRouter } from 'next/navigation';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';
import { cloneDeep } from 'lodash';

import { createApp, getApps, moveApps, removeApp, updateApp } from '@/src/app/[lang]/assets-applications/actions';
import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import TabsContent from '@/src/components/Applications/View/TabsContent';
import { addNewVersion, getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import AssetHeader from '@/src/components/EntityHeaderControls/AssetHeader';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { Asset, AssetApp } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { changePath, getListOfPathsToMove, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { EntityViewTab, getTabsForAsset, toolsTab } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';

interface Props {
  etag: string;
  originalApp: AssetApp;
  assets: AssetApp[];
  models: DialModel[];
  applications: DialApplication[];
  schemes: DialApplicationScheme[];
  interceptors: DialInterceptor[];
}

const AppView: FC<Props> = ({ etag, originalApp, assets, models, applications, schemes, interceptors }) => {
  const t = useI18n();
  const router = useRouter();
  const { fetchFiles } = useAppsFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [tabs, setTabs] = useState<TabModel[]>(getTabsForAsset(t, ApplicationRoute.AssetsApplications));

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedApp, setSelectedApp] = useState(cloneDeep(originalApp));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(true);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      isHideJsonSelector: () => {
        const scheme = getAppRunner(selectedApp, schemes);

        return (
          activeTab === EntityViewTab.Parameters && (scheme?.['dial:applicationTypeEditorUrl'] || selectedApp.editorUrl)
        );
      },
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [activeTab, isEditorEnabled, schemes, selectedApp],
  );

  useEffect(() => {
    const appRunner = getAppRunner(originalApp, schemes);

    if (originalApp.mcp?.endpoint || (appRunner && appRunner?.['dial:applicationTypeMcp'])) {
      setTabs(getTabsForAsset(t, ApplicationRoute.AssetsApplications).toSpliced(1, 0, toolsTab(t)));
    } else {
      setTabs(getTabsForAsset(t, ApplicationRoute.AssetsApplications));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalApp.mcp?.endpoint]);

  useEffect(() => {
    setSelectedApp(cloneDeep(originalApp));
  }, [originalApp]);

  useEffect(() => {
    if (Object.keys(selectedApp).length && originalApp) {
      setIsChanged(!isEqualSkippingUndefined(originalApp, selectedApp));
    }
  }, [selectedApp, originalApp]);

  const onDiscard = useCallback(() => {
    setIsSkipRefresh(false);
    setDiscardKey((prev) => prev + 1);
    setSelectedApp(cloneDeep(originalApp));
  }, [originalApp]);

  const onSave = useCallback(
    (newVersion?: string) => {
      const isNeedToMove = getIsNeedToMove(selectedApp, originalApp);
      let updatedEntity = getEntityForUpdate(selectedApp, originalApp);
      let updateFunction = updateApp;

      if (newVersion) {
        updatedEntity = addNewVersion(updatedEntity, newVersion);
        updateFunction = createApp;
      }
      getReqRef.current(updateFunction, updatedEntity, etag).then((res) => {
        if (res.success) {
          showNotification(
            getSuccessNotification(
              newVersion
                ? getCreateNotificationTitle(ApplicationRoute.AssetsApplications, t)
                : getUpdateNotificationTitle(ApplicationRoute.AssetsApplications, t),
              newVersion
                ? getCreateNotificationDescription(ApplicationRoute.AssetsApplications, updatedEntity.name, t)
                : getUpdateNotificationDescription(ApplicationRoute.AssetsApplications, updatedEntity.name, t),
            ),
          );
          if (isNeedToMove) {
            getApps(addTrailingSlash(updatedEntity.folderId)).then((apps) => {
              const pathsToMove = getListOfPathsToMove(updatedEntity, null, apps || []);
              const newPath = removeTrailingSlash(selectedApp.folderId);
              moveApps(pathsToMove, newPath).then((r) => {
                if (r.every((response) => response.success)) {
                  router.push(
                    getUrnForEntity(ApplicationRoute.AssetsApplications, {
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
            router.push(getUrnForEntity(ApplicationRoute.AssetsApplications, updatedEntity));
          }
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [selectedApp, originalApp, etag, showNotification, t, router, fetchFiles],
  );

  const onChangeEntity = useCallback(
    (entity: AssetApp, skipRefresh?: boolean) => {
      setSelectedApp(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedApp],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <AssetHeader
        etag={etag}
        view={ApplicationRoute.AssetsApplications}
        entity={selectedApp}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        assets={assets}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeApp}
        getAssetContext={useAppsFolder}
        onChangeAsset={setSelectedApp as (asset: Asset) => void}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled && !(activeTab === EntityViewTab.Parameters) ? (
          <EntityJsonEditor entity={selectedApp} setSelectedEntity={setSelectedApp} setIsChanged={setIsChanged} />
        ) : (
          <TabsContent
            key={discardKey}
            activeTab={activeTab}
            names={[]}
            models={models}
            applications={applications}
            applicationSchemes={schemes}
            interceptors={interceptors}
            view={ApplicationRoute.AssetsApplications}
            selectedApplication={selectedApp}
            originalApplication={originalApp}
            isEditorEnabled={isEditorEnabled}
            isSkipRefresh={isSkipRefresh}
            isChanged={isChanged}
            onSave={onSave}
            onChangeApplication={onChangeEntity as (application: DialApplication) => void}
            setIsChanged={setIsChanged}
            setSelectedApplication={setSelectedApp as Dispatch<SetStateAction<DialApplication>>}
          />
        )}
      </div>
    </div>
  );
};

export default AppView;
