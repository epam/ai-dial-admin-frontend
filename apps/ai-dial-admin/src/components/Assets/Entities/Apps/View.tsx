'use client';

import { useRouter } from 'next/navigation';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TabItem } from '@epam/ai-dial-ui-kit';
import { cloneDeep } from 'lodash';

import { moveApps, removeApp, updateApp } from '@/src/app/[lang]/assets-applications/actions';
import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import TabsContent from '@/src/components/Applications/View/TabsContent';
import { getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import AssetHeader from '@/src/components/EntityHeaderControls/AssetHeader';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useIframeSaveFeedback } from '@/src/components/EntityView/hooks/use-iframe-save-feedback';
import { useParametersTabGuard } from '@/src/components/EntityView/hooks/use-parameters-tab-guard';
import EntityViewModals from '@/src/components/EntityView/Modals/EntityViewModals';
import { ROOT_FOLDER } from '@/src/constants/file';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import type { CatalogSchemaOptions } from '@/src/server/catalog-schemas/read-options';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { changePath, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { EntityViewTab, getTabsForAsset, toolsTab } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';

interface Props {
  etag: string;
  originalApp: AssetApp;
  models: DialModel[];
  applications: DialApplication[];
  schemes: DialApplicationScheme[];
  interceptors: DialInterceptor[];
  globalInterceptors?: string[];
  translators?: ResourceInfo[];
  catalogSchemas?: CatalogSchemaOptions;
  /** i18n keys for non-fatal problems from the server-side option reads, resolved here. */
  optionWarnings?: EntitiesI18nKey[];
}

const AppView: FC<Props> = ({
  etag: initialEtag,
  originalApp,
  models,
  applications,
  schemes,
  interceptors,
  globalInterceptors,
  translators,
  catalogSchemas,
  optionWarnings,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { fetchFiles } = useAppsFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const { visualizerConnector, featureFlags } = useAppContext();

  const [tabs, setTabs] = useState<TabItem[]>(getTabsForAsset(t, ApplicationRoute.AssetsApplications, featureFlags));

  const [etag, setEtag] = useState(initialEtag);
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
      setTabs(getTabsForAsset(t, ApplicationRoute.AssetsApplications, featureFlags).toSpliced(1, 0, toolsTab(t)));
    } else {
      setTabs(getTabsForAsset(t, ApplicationRoute.AssetsApplications, featureFlags));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalApp.mcp?.endpoint]);

  useEffect(() => {
    setSelectedApp(cloneDeep(originalApp));
  }, [originalApp]);

  // Resyncs after a `router.refresh()` (a successful save re-fetches the page). A failed save updates
  // `etag` itself from the response below, without waiting for a refresh — Core returns its current
  // etag on every response, success or not, and a save rejected for an unrelated reason (e.g. a
  // validation error) still leaves the retry needing that fresher value or it fails precondition.
  useEffect(() => {
    setEtag(initialEtag);
  }, [initialEtag]);

  // An option list read from only one of Core's two populations is shown rather than withheld, so the
  // user has to be told the list is incomplete — otherwise a missing interceptor reads as deleted.
  useEffect(() => {
    optionWarnings?.forEach((warning) => {
      showNotification(getErrorNotification(t(EntitiesI18nKey.IncompleteOptionList), t(warning)));
    });
  }, [optionWarnings, showNotification, t]);

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

  const onSave = useCallback(async () => {
    const isNeedToMove = getIsNeedToMove(selectedApp, originalApp);
    const updatedEntity = getEntityForUpdate(
      {
        ...selectedApp,
        name: originalApp.name,
        path: originalApp.path,
        version: originalApp.version,
        _metadata: originalApp._metadata,
      },
      originalApp,
    );
    try {
      const res = await getReqRef.current(updateApp, updatedEntity, etag);
      if (res.etag) {
        setEtag(res.etag);
      }
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.AssetsApplications, t),
            getUpdateNotificationDescription(
              ApplicationRoute.AssetsApplications,
              updatedEntity.name || updatedEntity._metadata?.name || '',
              t,
            ),
          ),
        );
        if (isNeedToMove) {
          const originalPath = originalApp.path || originalApp._metadata?.path || '';
          const newPath = removeTrailingSlash(selectedApp.folderId ?? selectedApp._metadata?.folderId);
          const [moveResult] = await moveApps([originalPath], newPath);
          if (!moveResult.success) {
            showNotification(
              getErrorNotification(moveResult.errorHeader, moveResult.errorMessage, moveResult.requestId),
            );
            return;
          }
          await fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
          router.push(
            getUrnForEntity(ApplicationRoute.AssetsApplications, {
              name: updatedEntity.name || updatedEntity._metadata?.name || '',
              path: changePath(originalPath, newPath),
            }),
          );
        } else {
          fetchFiles(updatedEntity.folderId || updatedEntity._metadata?.folderId || '');
          router.push(getUrnForEntity(ApplicationRoute.AssetsApplications, updatedEntity));
        }
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    } catch (error) {
      showNotification(getErrorNotification((error as Error).message));
    }
  }, [selectedApp, originalApp, etag, showNotification, t, router, fetchFiles]);

  const onIframeSaved = useCallback(() => {
    fetchFiles(selectedApp.folderId || selectedApp._metadata?.folderId || '');
  }, [fetchFiles, selectedApp.folderId, selectedApp._metadata?.folderId]);

  const { onIframeSaveSuccess, onIframeSaveError } = useIframeSaveFeedback({
    view: ApplicationRoute.AssetsApplications,
    entityName: selectedApp.name || selectedApp._metadata?.name,
    onSaved: onIframeSaved,
  });

  const {
    frameRef,
    isIframeDirty,
    isIframeSaving,
    isIframeValid,
    onFrameDirtyChange,
    onFrameValidityChange,
    onFrameSaveSuccess,
    onFrameSaveError,
    onSaveIframe,
    onDiscardIframe,
    isModalOpen,
    modalType,
    onModalClose,
    onModalCancel,
    onModalConfirm,
    onChangeActiveTab,
  } = useParametersTabGuard({
    activeTab,
    isChanged,
    visualizerConnector,
    onSaveEntity: () => onSave(),
    onDiscardEntity: onDiscard,
    onSetActiveTab: setActiveTab,
    onIframeSaveSuccess,
    onIframeSaveError,
  });

  const frameCallbacks = useMemo(
    () => ({
      onDirtyChange: onFrameDirtyChange,
      onValidityChange: onFrameValidityChange,
      onSaveSuccess: onFrameSaveSuccess,
      onSaveError: onFrameSaveError,
    }),
    [onFrameDirtyChange, onFrameValidityChange, onFrameSaveSuccess, onFrameSaveError],
  );

  const onSaveChanges = useCallback(() => {
    if (isIframeDirty) {
      onSaveIframe();
    } else {
      void onSave();
    }
  }, [isIframeDirty, onSave, onSaveIframe]);

  const onDiscardChanges = useCallback(() => {
    if (isIframeDirty) {
      onDiscardIframe();
    } else {
      onDiscard();
    }
  }, [isIframeDirty, onDiscard, onDiscardIframe]);

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
        entity={{
          ...selectedApp,
          folderId: originalApp.folderId,
          name: originalApp.name,
          path: originalApp.path,
          version: originalApp.version,
          _metadata: originalApp._metadata,
        }}
        isChanged={isChanged || isIframeDirty}
        isSaving={isIframeSaving}
        isSaveDisabled={!isIframeValid}
        onDiscard={onDiscardChanges}
        onSave={onSaveChanges}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={onChangeActiveTab}
        onRemove={removeApp}
        getAssetContext={useAppsFolder}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled && !(activeTab === EntityViewTab.Parameters) ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedApp}
            setSelectedEntity={setSelectedApp}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            activeTab={activeTab}
            names={[]}
            models={models}
            applications={applications}
            applicationSchemes={schemes}
            interceptors={interceptors}
            globalInterceptors={globalInterceptors}
            translators={translators}
            catalogSchemas={catalogSchemas}
            view={ApplicationRoute.AssetsApplications}
            selectedApplication={selectedApp}
            originalApplication={originalApp}
            isEditorEnabled={isEditorEnabled}
            isSkipRefresh={isSkipRefresh}
            discardKey={discardKey}
            isChanged={isChanged}
            frameRef={frameRef}
            frameCallbacks={frameCallbacks}
            onSave={onSaveChanges}
            onChangeApplication={onChangeEntity as (application: DialApplication) => void}
            setIsChanged={setIsChanged}
            setSelectedApplication={setSelectedApp as Dispatch<SetStateAction<DialApplication>>}
          />
        )}
      </div>

      <EntityViewModals
        isModalOpen={isModalOpen}
        modalType={modalType}
        handleConfirm={onModalConfirm}
        handleClose={onModalClose}
        handleCancel={onModalCancel}
      />
    </div>
  );
};

export default AppView;
