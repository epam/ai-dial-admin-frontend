'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonAppearance, ButtonVariant, DialButtonDropdown, DropdownItem } from '@epam/ai-dial-ui-kit';
import { cloneDeep } from 'lodash';

import {
  getCoreRunner,
  removeApplicationScheme,
  updateApplicationScheme,
  updateCoreRunner,
} from '@/src/app/[lang]/application-runners/actions';
import { createApplication } from '@/src/app/[lang]/applications/actions';
import { createApp } from '@/src/app/[lang]/assets-applications/actions';
import CreateAsset from '@/src/components/Assets/Deployments/CreateAsset';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialRole } from '@/src/models/dial/role';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getAppRunnerTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalScheme: DialApplicationScheme;
  roles: DialRole[];
  names: string[];
  interceptors: DialInterceptor[];
}

const ApplicationRunnersView: FC<Props> = ({ etag, originalScheme, names, ...props }) => {
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
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(ExportFormat.ADMIN);
  const [coreRunner, setCoreRunner] = useState<DialApplicationScheme | null>(null);
  const [isCreateAppModalOpen, setIsCreateAppModalOpen] = useState(false);
  const [isCreateAssetAppModalOpen, setIsCreateAssetAppModalOpen] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(true);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      selectedFormat,
      onChangeSelectedFormat: setSelectedFormat,
      onToggleEditor: () => {
        setSelectedFormat(ExportFormat.ADMIN);

        setIsEditorEnabled((prev) => !prev);
      },
    }),
    [isEditorEnabled, selectedFormat],
  );

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

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      setSelectedFormat(ExportFormat.ADMIN);
    }
    setIsSkipRefresh(false);
    setSelectedRunner(cloneDeep(originalScheme));
  }, [isEditorEnabled, originalScheme]);

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

  const onChangeRunner = useCallback(
    (runner: DialApplicationScheme) => {
      setSelectedRunner(runner);
      setIsSkipRefresh(true);
    },
    [setSelectedRunner],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.ApplicationRunners}
        entity={selectedRunner}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeApplicationScheme}
      >
        <DialButtonDropdown
          label={t(ButtonsI18nKey.Create)}
          items={items}
          variant={ButtonVariant.Neutral}
          appearance={ButtonAppearance.Outlined}
        />
      </SimpleEntityHeader>

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor entity={selectedRunner} setSelectedEntity={setSelectedRunner} setIsChanged={setIsChanged} />
        ) : (
          <TabsContent
            activeTab={activeTab}
            selectedFormat={selectedFormat}
            selectedRunner={selectedRunner}
            onChange={onChangeRunner}
            names={names}
            isSkipRefresh={isSkipRefresh}
            {...props}
          />
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
              context={useAppsFolder}
              initialValues={{ applicationTypeSchemaId: selectedRunner.$id }}
            />,
            document.body,
          )}
      </div>
    </div>
  );
};

export default ApplicationRunnersView;
