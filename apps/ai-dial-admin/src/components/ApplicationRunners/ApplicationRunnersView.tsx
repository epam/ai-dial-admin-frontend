'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonAppearance, ButtonVariant, DialButtonDropdown, DialTabs, DropdownItem } from '@epam/ai-dial-ui-kit';
import { cloneDeep } from 'lodash';

import {
  getCoreRunner,
  removeApplicationScheme,
  updateApplicationScheme,
  updateCoreRunner,
} from '@/src/app/[lang]/application-runners/actions';
import { createApplication } from '@/src/app/[lang]/applications/actions';
import { createApp } from '@/src/app/[lang]/assets-applications/actions';
import ApplicationParametersTab from '@/src/components/Applications/ParametersTab/ParametersTab';
import CreateAsset from '@/src/components/Assets/Deployments/CreateAsset';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import EntityRoutes from '@/src/components/EntityView/AppRoute/AppRoute';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityInterceptors from '@/src/components/EntityView/Interceptors/Interceptors';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ChatEntity } from '@/src/models/dial/base-entity';
import { Asset } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialRole } from '@/src/models/dial/role';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getAppRunnerTabs } from '@/src/utils/tabs/utils';
import AppRunnerApplications from './ConfigurationView/Applications';
import AppRunnerFeatures from './ConfigurationView/Features';
import SchemeProperties from './ConfigurationView/Properties';

interface Props {
  etag: string;
  originalScheme: DialApplicationScheme;
  roles: DialRole[] | null;
  names: string[];
  interceptors: DialInterceptor[] | null;
}

const ApplicationRunnersView: FC<Props> = ({ etag, originalScheme, roles, names, interceptors }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const tabs = getAppRunnerTabs(t);

  const items: DropdownItem[] = [
    { key: 'Application', label: t(CreateI18nKey.Application), onClick: () => setIsCreateAppModalOpen(true) },
    {
      key: 'AssetApplication',
      label: t(CreateI18nKey.AssetApplication),
      onClick: () => setIsCreateAssetAppModalOpen(true),
    },
  ];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRunner, setSelectedRunner] = useState(cloneDeep(originalScheme));
  const [isChanged, setIsChanged] = useState(false);
  const [isJsonEditorEnabled, setIsJsonEditorEnabled] = useState(false);
  const [key, setKey] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState(ExportFormat.ADMIN);
  const [coreRunner, setCoreRunner] = useState<DialApplicationScheme | null>(null);
  const [isCreateAppModalOpen, setIsCreateAppModalOpen] = useState(false);
  const [isCreateAssetAppModalOpen, setIsCreateAssetAppModalOpen] = useState(false);

  useEffect(() => {
    const name = originalScheme?.$id;
    if (!coreRunner && name) {
      getReqRef.current(getCoreRunner, name).then((data) => {
        setCoreRunner(data.response);
      });
    }
  }, [coreRunner, originalScheme]);

  useEffect(() => {
    setSelectedRunner(
      selectedFormat === ExportFormat.CORE ? cloneDeep(coreRunner as DialApplicationScheme) : cloneDeep(originalScheme),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalScheme]);

  useEffect(() => {
    const isEqualAdminRunner = isEqualSkippingUndefined(originalScheme, selectedRunner);
    const isEqualCoreRunner = isEqualSkippingUndefined(selectedRunner, coreRunner);

    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreRunner : !isEqualAdminRunner);
  }, [selectedFormat, originalScheme, selectedRunner, coreRunner]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (isJsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      setSelectedFormat(ExportFormat.ADMIN);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    dispatch({ type: ValidationActionType.Reset });
    setSelectedRunner(cloneDeep(originalScheme));
  }, [isJsonEditorEnabled, originalScheme, dispatch]);

  const onChangeScheme = useCallback(
    (entity: DialApplicationScheme) => {
      setSelectedRunner(entity);
    },
    [setSelectedRunner],
  );

  const onToggleJsonEditor = useCallback(() => {
    setSelectedRunner(cloneDeep(originalScheme));
    setSelectedFormat(ExportFormat.ADMIN);

    setIsJsonEditorEnabled((prev) => !prev);
  }, [originalScheme]);

  const onSave = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? getReqRef.current(updateCoreRunner, selectedRunner as Record<string, unknown>, originalScheme.$id || '', etag)
        : getReqRef.current(updateApplicationScheme, selectedRunner, etag);

    req.then((res) => {
      if (res.success) {
        dispatch({ type: ValidationActionType.Reset });
        setCoreRunner(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.ApplicationRunners, t),
            getUpdateNotificationDescription(ApplicationRoute.ApplicationRunners, selectedRunner.$id, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedFormat, selectedRunner, originalScheme.$id, etag, dispatch, showNotification, t, router]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={getViewHeaderClassName(isJsonEditorEnabled)}>
        {!isJsonEditorEnabled && (
          <div className="flex-1 min-w-0">
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
          </div>
        )}
        <HeaderButtons
          view={ApplicationRoute.ApplicationRunners}
          entity={selectedRunner}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          onRemove={removeApplicationScheme}
          isJsonEditorEnabled={isJsonEditorEnabled}
          onToggleJsonEditor={onToggleJsonEditor}
          selectedFormat={selectedFormat}
          onChangeSelectedFormat={setSelectedFormat}
        >
          <DialButtonDropdown
            label={t(ButtonsI18nKey.Create)}
            items={items}
            variant={ButtonVariant.Neutral}
            appearance={ButtonAppearance.Outlined}
          />
        </HeaderButtons>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {isJsonEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedRunner}
            setSelectedEntity={setSelectedRunner}
            setIsChanged={setIsChanged}
          />
        ) : (
          selectedFormat === ExportFormat.ADMIN && (
            <>
              {activeTab === EntityViewTab.Properties && (
                <div className="w-full flex flex-col">
                  <EntityHeader entity={selectedRunner} view={ApplicationRoute.ApplicationRunners} />
                  <div className="flex-1 min-h-0 pt-8">
                    <SchemeProperties
                      names={names}
                      runner={selectedRunner}
                      isImmutable={true}
                      onChangeRunner={onChangeScheme}
                    />
                  </div>
                </div>
              )}

              {activeTab === EntityViewTab.Parameters && (
                <ApplicationParametersTab view={ApplicationRoute.ApplicationRunners} entity={selectedRunner} />
              )}

              {activeTab === EntityViewTab.Features && (
                <AppRunnerFeatures runner={selectedRunner} onChangeRunner={onChangeScheme} />
              )}

              {activeTab === EntityViewTab.Interceptors && (
                <EntityInterceptors
                  entity={selectedRunner as ChatEntity}
                  interceptors={interceptors || []}
                  onChangeEntity={onChangeScheme}
                  view={ApplicationRoute.ApplicationRunners}
                />
              )}

              {activeTab === EntityViewTab.Applications && (
                <AppRunnerApplications appRunner={selectedRunner} onChangeAppRunner={onChangeScheme} />
              )}

              {activeTab === EntityViewTab.Routes && (
                <EntityRoutes
                  iAppRunnerView={true}
                  roles={roles}
                  routes={selectedRunner['dial:applicationTypeRoutes']}
                  onChangeRoutes={(routes) =>
                    setSelectedRunner({ ...selectedRunner, ['dial:applicationTypeRoutes']: routes })
                  }
                />
              )}

              {activeTab === EntityViewTab.Audit && (
                <EntityAudit entity={selectedRunner} view={ApplicationRoute.ApplicationRunners} />
              )}
            </>
          )
        )}
        {isCreateAppModalOpen &&
          createPortal(
            <CreateEntity
              route={ApplicationRoute.Applications}
              isModalOpen={isCreateAppModalOpen}
              createEntity={createApplication}
              onClose={() => setIsCreateAppModalOpen(false)}
              names={names}
              initialValues={{ customAppSchemaId: selectedRunner.$id }}
            />,
            document.body,
          )}
        {isCreateAssetAppModalOpen &&
          createPortal(
            <CreateAsset
              view={ApplicationRoute.AssetsApplications}
              isModalOpen={isCreateAssetAppModalOpen}
              onClose={() => setIsCreateAssetAppModalOpen(false)}
              onCreate={createApp}
              context={useAppsFolder as () => AssetsFolderContext<DialFile | Asset>}
              initialValues={{ applicationTypeSchemaId: selectedRunner.$id }}
            />,
            document.body,
          )}
      </div>
    </div>
  );
};

export default ApplicationRunnersView;
