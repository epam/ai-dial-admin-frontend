'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonAppearance, ButtonVariant, DialButtonDropdown, DropdownItem } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import { getResolvedRunnerSchema, removeRunner, updateRunner } from '@/src/app/[lang]/platform-app-runners/actions';
import { createApp } from '@/src/app/[lang]/assets-applications/actions';
import CreateAsset from '@/src/components/Assets/Deployments/CreateAsset';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useAppRunnersFolder } from '@/src/context/assets/AppRunnersFolderContext';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { ButtonsI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialAppRunnerResource, DialResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { toCoreRunnerName } from '@/src/utils/app-runners/core-runner-name';
import { toRunnerReference } from '@/src/utils/app-runners/runner-reference';
import { validateAppRunner } from '@/src/utils/app-runners/validation';
import { createSchemaSource } from '@/src/utils/entities/application-source';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getSchemaDefaults } from '@/src/utils/schema';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalRunner: DialAppRunnerResource;
  roles: DialRole[];
  interceptors: DialInterceptor[];
  globalInterceptors: string[];
  /** i18n keys for non-fatal problems from the server-side option reads, resolved here. */
  optionWarnings?: EntitiesI18nKey[];
}

const AppRunnerAssetView: FC<Props> = ({
  etag,
  originalRunner,
  roles,
  interceptors,
  globalInterceptors,
  optionWarnings,
}) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.PlatformAppRunners);
  const router = useRouter();
  const { fetchFiles } = useAppRunnersFolder();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRunner, setSelectedRunner] = useState(structuredClone(originalRunner));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);
  const [isCreateAssetAppModalOpen, setIsCreateAssetAppModalOpen] = useState(false);
  const [applicationProperties, setApplicationProperties] = useState<Record<string, unknown>>();

  const createItems: DropdownItem[] = [
    {
      key: 'AssetApplication',
      label: t(CreateI18nKey.AssetApplication),
      onClick: () => setIsCreateAssetAppModalOpen(true),
    },
  ];

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setSelectedRunner(structuredClone(originalRunner));
  }, [originalRunner]);

  // Resolved against the saved runner, not `selectedRunner`: Core resolves what is stored, so in-flight
  // edits would derive defaults from a schema Core has not seen. A failed resolve falls back to the
  // runner's own schema so the create modal still opens with usable defaults.
  useEffect(() => {
    const id = originalRunner.$id;

    if (!id) {
      return;
    }

    getResolvedRunnerSchema(toCoreRunnerName(id)).then((res) => {
      const resolved = res.success ? (res.response as DialApplicationScheme | undefined) : undefined;
      setApplicationProperties(getSchemaDefaults((resolved ?? originalRunner) as JSONSchema7));
    });
  }, [originalRunner]);

  // An option list read from only one of Core's two populations is shown rather than withheld, so the
  // user has to be told the list is incomplete — otherwise a missing interceptor reads as deleted.
  useEffect(() => {
    optionWarnings?.forEach((warning) => {
      showNotification(getErrorNotification(t(EntitiesI18nKey.IncompleteOptionList), t(warning)));
    });
  }, [optionWarnings, showNotification, t]);

  useEffect(() => {
    if (Object.keys(selectedRunner).length && originalRunner) {
      setIsChanged(!isEqualSkippingUndefined(originalRunner, selectedRunner));
    }
  }, [selectedRunner, originalRunner]);

  const onDiscard = useCallback(() => {
    setIsSkipRefresh(false);
    setSelectedRunner(structuredClone(originalRunner));
    setDiscardKey((prev) => prev + 1);
  }, [originalRunner]);

  const onCloseCreateAssetAppModal = useCallback(() => {
    setIsCreateAssetAppModalOpen(false);
    dispatch({ type: ValidationActionType.Reset });
  }, [dispatch]);

  const onChange = useCallback((runner: DialAppRunnerResource, skipRefresh?: boolean) => {
    setSelectedRunner(runner);
    setIsSkipRefresh(!!skipRefresh);
  }, []);

  const onSave = useCallback(() => {
    const errors = validateAppRunner(selectedRunner);
    if (errors.length) {
      showNotification(
        getErrorNotification(
          t(EntitiesI18nKey.InvalidAppRunner),
          errors.map((error) => `${error.field}: ${error.message}`).join('; '),
        ),
      );
      return;
    }
    getReqRef.current(updateRunner, selectedRunner, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.PlatformAppRunners, t),
            getUpdateNotificationDescription(ApplicationRoute.PlatformAppRunners, selectedRunner.$id, t),
          ),
        );
        fetchFiles(selectedRunner.folderId);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedRunner, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.PlatformAppRunners}
        entity={selectedRunner}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeRunner}
        getAssetContext={useAppRunnersFolder}
      >
        <DialButtonDropdown
          label={t(ButtonsI18nKey.Create)}
          items={createItems}
          variant={ButtonVariant.Neutral}
          appearance={ButtonAppearance.Outlined}
        />
      </SimpleEntityHeader>

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedRunner}
            setSelectedEntity={setSelectedRunner}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            key={discardKey}
            activeTab={activeTab}
            runner={selectedRunner}
            roles={roles}
            interceptors={interceptors}
            globalInterceptors={globalInterceptors}
            isSkipRefresh={isSkipRefresh}
            onChange={onChange}
          />
        )}
        {isCreateAssetAppModalOpen &&
          createPortal(
            <CreateAsset
              view={ApplicationRoute.AssetsApplications}
              isModalOpen={isCreateAssetAppModalOpen}
              onClose={onCloseCreateAssetAppModal}
              onCreate={createApp as (entity: DialResource) => Promise<ServerActionResponse>}
              context={useAppsFolder}
              initialValues={{
                source: originalRunner.$id ? createSchemaSource(toRunnerReference(originalRunner.$id)) : undefined,
                applicationProperties,
              }}
            />,
            document.body,
          )}
      </div>
    </div>
  );
};

export default AppRunnerAssetView;
