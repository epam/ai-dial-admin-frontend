'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';
import { cloneDeep } from 'lodash';

import { getApps, moveApps, removeApp, updateApp } from '@/src/app/[lang]/assets-applications/actions';
import { getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { EntityViewTab, getIsParametersTabAvailable } from '@/src/components/EntityView/View/utils';
import ViewContent from '@/src/components/EntityView/View/Content/ViewContent';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useAppsFolder } from '@/src/context/AppsFolderContext';
import { AssetsFolderContext } from '@/src/context/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialFile } from '@/src/models/dial/file';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { addTrailingSlash, changePath, getListOfPathsToMove, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { getTabsForAssetApp } from './utils';

interface Props {
  originalApp: DialAssetApp;
  apps: DialAssetApp[];
  models: DialModel[];
  applications: DialApplication[];
  schemes: DialApplicationScheme[];
  interceptors: DialInterceptor[];
}

const AppView: FC<Props> = ({ originalApp, apps, models, applications, schemes, interceptors }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const tabs = getTabsForAssetApp(t, getIsParametersTabAvailable(originalApp, schemes));
  const router = useRouter();
  const { fetchFiles } = useAppsFolder();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedApp, setSelectedApp] = useState(cloneDeep(originalApp));
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);

  const [key, setKey] = useState(0);

  useEffect(() => {
    setSelectedApp(cloneDeep(originalApp));
  }, [originalApp]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    if (Object.keys(selectedApp).length && originalApp) {
      setIsChanged(!isEqualSkippingUndefined(originalApp, selectedApp));
    }
  }, [selectedApp, originalApp]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (jsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      // TODO: Revisit solution
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedApp(cloneDeep(originalApp));
  }, [jsonEditorEnabled, originalApp, dispatch]);

  const onSave = useCallback(() => {
    const isNeedToMove = getIsNeedToMove(selectedApp, originalApp);
    const updatedEntity = getEntityForUpdate(selectedApp, originalApp);
    updateApp(updatedEntity).then((res) => {
      if (res.success) {
        if (isNeedToMove) {
          getApps(addTrailingSlash(updatedEntity.folderId)).then((apps) => {
            const pathsToMove = getListOfPathsToMove(updatedEntity, null, apps || []);
            const newPath = removeTrailingSlash(selectedApp.folderId);
            moveApps(pathsToMove, newPath).then((r) => {
              if (r.every((response) => response.success)) {
                router.push(
                  `${ApplicationRoute.AssetsApplications}/${getEntityPath(ApplicationRoute.AssetsApplications, { name: updatedEntity.name, path: changePath(updatedEntity.path, newPath) })}`,
                );
                fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
              }
            });
          });
        } else {
          fetchFiles(updatedEntity.folderId);
          router.push(
            `${ApplicationRoute.AssetsApplications}/${getEntityPath(ApplicationRoute.AssetsApplications, updatedEntity)}`,
          );
        }
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedApp, originalApp, router, fetchFiles, showNotification]);

  const onChangeEntity = useCallback(
    (entity: DialAssetApp) => {
      setSelectedApp(entity);
    },
    [setSelectedApp],
  );

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
        <HeaderButtons
          view={ApplicationRoute.Prompts}
          entity={selectedApp}
          isChanged={isChanged}
          onSave={onSave}
          onDiscard={onDiscard}
          removeEntity={removeApp}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          existingVersions={apps?.map((app) => app.version) || []}
          context={useAppsFolder as () => AssetsFolderContext<DialFile | DialAssetApp>}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedApp}
            setSelectedEntity={setSelectedApp}
            setIsChanged={setIsChanged}
          />
        ) : (
          <ViewContent
            activeTab={activeTab}
            names={[]}
            assetApps={apps}
            models={models}
            applications={applications}
            applicationSchemes={schemes}
            interceptors={interceptors}
            view={ApplicationRoute.AssetsApplications}
            selectedEntity={selectedApp}
            jsonEditorEnabled={jsonEditorEnabled}
            setSelectedApp={setSelectedApp}
            isSkipRefresh={false}
            onChangeEntity={onChangeEntity as (entity: BaseEntity) => void}
          />
        )}
      </div>
    </div>
  );
};

export default AppView;
