'use client';

import { useRouter } from 'next/navigation';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cloneDeep } from 'lodash';

import { removePlatformApplication, updatePlatformApplication } from '@/src/app/[lang]/assets-applications/actions';
import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import TabsContent from '@/src/components/Applications/View/TabsContent';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useParametersTabGuard } from '@/src/components/EntityView/hooks/use-parameters-tab-guard';
import EntityViewModals from '@/src/components/EntityView/Modals/EntityViewModals';
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
import { DialPlatformApplicationResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset, toolsTab } from '@/src/utils/tabs/utils';

interface Props {
  etag: string;
  originalApp: AssetApp;
  models: DialModel[];
  applications: DialApplication[];
  schemes: DialApplicationScheme[];
  interceptors: DialInterceptor[];
  globalInterceptors?: string[];
  /** i18n keys for non-fatal problems from the server-side option reads, resolved here. */
  optionWarnings?: EntitiesI18nKey[];
}

/**
 * Platform-bucket application detail view. Core gives platform-bucket applications full field/tab
 * parity with public-bucket ones (MCP, Parameters, Features, external services, schema-rich apps —
 * everything except `function`/code-runtime apps, which Core rejects for this bucket, and
 * versioning/folders, which this bucket structurally lacks — see design.md's Context). So this reuses
 * the exact same `TabsContent`/tab components the public Apps view uses, passing
 * `view={ApplicationRoute.AssetsApplications}` through them: that value selects the *asset-shaped*
 * `DialApplicationResource` branch those components already have (as opposed to the admin-BE
 * config-entity shape), which is equally true for a platform-bucket resource — only the header chrome
 * (no version selector, no publish, no move) and which server actions get called differ here.
 */
const PlatformApplicationView: FC<Props> = ({
  etag,
  originalApp,
  models,
  applications,
  schemes,
  interceptors,
  globalInterceptors,
  optionWarnings,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { fetchFiles } = useAppsFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());
  const { visualizerConnector } = useAppContext();

  const [tabs, setTabs] = useState(getTabsForAsset(t, ApplicationRoute.AssetsApplications));
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedApp, setSelectedApp] = useState(cloneDeep(originalApp));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
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

  // MCP-configured applications get a Tools tab the same way the public Apps view does — MCP is fully
  // supported for platform-bucket applications, unlike `function`/code-runtime apps.
  useEffect(() => {
    const appRunner = getAppRunner(originalApp, schemes, ApplicationRoute.AssetsApplications);
    if (originalApp.mcp?.endpoint || appRunner?.['dial:applicationTypeMcp']) {
      setTabs(getTabsForAsset(t, ApplicationRoute.AssetsApplications).toSpliced(1, 0, toolsTab(t)));
    } else {
      setTabs(getTabsForAsset(t, ApplicationRoute.AssetsApplications));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalApp.mcp?.endpoint]);

  useEffect(() => {
    setSelectedApp(cloneDeep(originalApp));
  }, [originalApp]);

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
    setDiscardKey((prev) => prev + 1);
    setSelectedApp(cloneDeep(originalApp));
  }, [originalApp]);

  const onSave = useCallback(() => {
    getReqRef
      .current(updatePlatformApplication, selectedApp as unknown as DialPlatformApplicationResource, etag)
      .then((res) => {
        if (res.success) {
          showNotification(
            getSuccessNotification(
              getUpdateNotificationTitle(ApplicationRoute.AssetsApplications, t),
              getUpdateNotificationDescription(ApplicationRoute.AssetsApplications, selectedApp.name, t),
            ),
          );
          fetchFiles(selectedApp.folderId);
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
  }, [selectedApp, etag, showNotification, t, router, fetchFiles]);

  const { isModalOpen, modalType, onModalClose, onModalCancel, onModalConfirm, onChangeActiveTab } =
    useParametersTabGuard({
      activeTab,
      isChanged,
      visualizerConnector,
      onSaveEntity: onSave,
      onDiscardEntity: onDiscard,
      onSetActiveTab: setActiveTab,
    });

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.AssetsApplications}
        entity={selectedApp}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={onChangeActiveTab}
        onRemove={removePlatformApplication}
        getAssetContext={useAppsFolder}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled && activeTab !== EntityViewTab.Parameters ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedApp}
            setSelectedEntity={setSelectedApp}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            key={discardKey}
            activeTab={activeTab}
            names={[]}
            models={models}
            applications={applications}
            applicationSchemes={schemes}
            interceptors={interceptors}
            globalInterceptors={globalInterceptors}
            view={ApplicationRoute.AssetsApplications}
            selectedApplication={selectedApp}
            originalApplication={originalApp}
            isEditorEnabled={isEditorEnabled}
            isSkipRefresh
            discardKey={discardKey}
            isChanged={isChanged}
            onSave={onSave}
            onChangeApplication={setSelectedApp as (application: DialApplication) => void}
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

export default PlatformApplicationView;
