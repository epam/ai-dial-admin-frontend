'use client';

import { useRouter } from 'next/navigation';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { cloneDeep } from 'lodash';

import { getApps, moveApps, removeApp, updateApp } from '@/src/app/[lang]/assets-applications/actions';
import { addNewVersion, getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import ViewContent from '@/src/components/EntityView/View/Content/ViewContent';
import { EntityViewTab } from '@/src/components/EntityView/View/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { addTrailingSlash, changePath, getListOfPathsToMove, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification } from '@/src/utils/notification';
import { getEntityPath, getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { getTabsForAssetApp } from './utils';

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
  const t = useI18n() as (stringToTranslate: string) => string;
  const tabs = getTabsForAssetApp(t);
  const router = useRouter();
  const { fetchFiles } = useAppsFolder();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedApp, setSelectedApp] = useState(cloneDeep(originalApp));
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState<boolean>(true);

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
      setIsSkipRefresh(false);
    }
    setSelectedApp(cloneDeep(originalApp));
  }, [jsonEditorEnabled, originalApp, dispatch]);

  const onSave = useCallback(
    (newVersion?: string) => {
      const isNeedToMove = getIsNeedToMove(selectedApp, originalApp);
      let updatedEntity = getEntityForUpdate(selectedApp, originalApp);
      if (newVersion) {
        updatedEntity = addNewVersion(updatedEntity, newVersion);
      }
      updateApp(updatedEntity, etag).then((res) => {
        if (res.success) {
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
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [selectedApp, originalApp, router, fetchFiles, etag, showNotification],
  );

  const onChangeEntity = useCallback(
    (entity: AssetApp, skipRefresh?: boolean) => {
      setSelectedApp(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedApp],
  );

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onRemove = useCallback(
    (entity: string) => {
      return removeApp(entity, etag);
    },
    [etag],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        {!jsonEditorEnabled && (
          <div className="flex-1 min-w-0">
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
          </div>
        )}
        <HeaderButtons
          activeTab={activeTab}
          view={ApplicationRoute.AssetsApplications}
          entity={selectedApp}
          isChanged={isChanged}
          onSave={onSave}
          onDiscard={onDiscard}
          removeEntity={onRemove}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          existingVersions={assets?.map((app) => app.version) || []}
          context={useAppsFolder as () => AssetsFolderContext<DialFile | AssetApp>}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled && !(ApplicationRoute.AssetsApplications && activeTab === EntityViewTab.Parameters) ? (
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
            assets={assets}
            models={models}
            applications={applications}
            applicationSchemes={schemes}
            interceptors={interceptors}
            view={ApplicationRoute.AssetsApplications}
            selectedEntity={selectedApp}
            jsonEditorEnabled={jsonEditorEnabled}
            isSkipRefresh={isSkipRefresh}
            isChanged={isChanged}
            onSave={onSave}
            onChangeEntity={onChangeEntity as (entity: BaseEntity) => void}
            key={key}
            setIsChanged={setIsChanged}
            setSelectedEntity={setSelectedApp as Dispatch<SetStateAction<BaseEntity>>}
          />
        )}
      </div>
    </div>
  );
};

export default AppView;
