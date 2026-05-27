'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';
import {
  getCoreApplication,
  removeApplication,
  updateApplication,
  updateCoreApplication,
} from '@/src/app/[lang]/applications/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ModalType } from '@/src/components/EntityView/Modals/constants';
import { useParametersTabGuard } from '@/src/components/EntityView/hooks/use-parameters-tab-guard';
import EntityViewModals from '@/src/components/EntityView/Modals/EntityViewModals';
import { isDisableRole } from '@/src/components/EntityView/Roles/utils';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getApplicationTabs, toolsTab } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';
import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';

interface Props {
  etag: string;
  names: string[];
  roles?: DialRole[];
  originalApplication: DialApplication;
  applications: DialApplication[];
  interceptors: DialInterceptor[];
  models: DialModel[];
  applicationSchemes: DialApplicationScheme[];
}

const ApplicationView: FC<Props> = ({ etag, originalApplication, ...props }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const [tabs, setTabs] = useState<TabModel[]>(getApplicationTabs(t));
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isSkipRefresh, setIsSkipRefresh] = useState(true);

  const [selectedApplication, setSelectedApplication] = useState(structuredClone(originalApplication));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreApplication, setCoreApplication] = useState<DialApplication | null>(null);
  const [discardKey, setDiscardKey] = useState(0);

  const { visualizerConnector } = useAppContext();

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
    const appRunner = getAppRunner(originalApplication, props.applicationSchemes);

    if (originalApplication.mcp?.endpoint || (appRunner && appRunner?.['dial:applicationTypeMcp'])) {
      setTabs(getApplicationTabs(t).toSpliced(1, 0, toolsTab(t)));
    } else {
      setTabs(getApplicationTabs(t));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalApplication.mcp?.endpoint]);

  useEffect(() => {
    const name = originalApplication?.name;
    if (!coreApplication && name) {
      getReqRef.current(getCoreApplication, name).then((data) => {
        setCoreApplication(data.response);
      });
    }
  }, [coreApplication, originalApplication]);

  useEffect(() => {
    setSelectedApplication(
      selectedFormat === ExportFormat.CORE
        ? structuredClone(coreApplication as DialApplication)
        : structuredClone(originalApplication),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalApplication]);

  useEffect(() => {
    const isEqualAdminApplication = isEqualSkippingUndefined(originalApplication, selectedApplication);
    const isEqualCoreApplication = isEqualSkippingUndefined(selectedApplication, coreApplication);
    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreApplication : !isEqualAdminApplication);
  }, [selectedFormat, originalApplication, selectedApplication, coreApplication]);

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      setSelectedFormat(ExportFormat.ADMIN);
    }

    setSelectedApplication(structuredClone(originalApplication));
    setIsSkipRefresh(false);
    setDiscardKey((prev) => prev + 1);
  }, [isEditorEnabled, originalApplication]);

  const onChangeApplication = useCallback(
    (entity: DialApplication, skipRefresh?: boolean) => {
      setSelectedApplication(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedApplication],
  );

  const onSave = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? updateCoreApplication(selectedApplication as Record<string, unknown>, originalApplication.name || '', etag)
        : updateApplication(selectedApplication, etag);

    req.then((res) => {
      if (res.success) {
        dispatch({ type: ValidationActionType.Reset });
        setCoreApplication(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Applications, t),
            getUpdateNotificationDescription(ApplicationRoute.Applications, selectedApplication.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedFormat, selectedApplication, originalApplication.name, etag, dispatch, showNotification, t, router]);

  const { isModalOpen, modalType, onModalOpen, onModalClose, onModalCancel, onModalConfirm, onChangeActiveTab } =
    useParametersTabGuard({
      activeTab,
      isChanged,
      visualizerConnector,
      onSaveEntity: onSave,
      onDiscardEntity: onDiscard,
      onSetActiveTab: setActiveTab,
    });

  const onTryToSave = useCallback(() => {
    if (selectedFormat !== ExportFormat.CORE && isDisableRole(selectedApplication as EntityRoleLimits)) {
      onModalOpen(ModalType.emptyRoles);
    } else {
      onSave();
    }
  }, [onModalOpen, selectedFormat, onSave, selectedApplication]);

  const onCancelModal = useCallback(
    (type: ModalType) => {
      if (type === ModalType.emptyRoles) {
        onModalClose();
      } else {
        onModalCancel(type);
      }
    },
    [onModalCancel, onModalClose],
  );

  const onConfirmModal = useCallback(
    (type: ModalType) => {
      if (type === ModalType.emptyRoles) {
        onSave();
        onModalClose();
      } else {
        onModalConfirm(type);
      }
    },
    [onModalClose, onModalConfirm, onSave],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.Applications}
        entity={selectedApplication}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onTryToSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={onChangeActiveTab}
        onRemove={removeApplication}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled && !(activeTab === EntityViewTab.Parameters) ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedApplication}
            setSelectedEntity={setSelectedApplication}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            key={discardKey}
            view={ApplicationRoute.Applications}
            activeTab={activeTab}
            selectedApplication={selectedApplication}
            originalApplication={originalApplication}
            onChangeApplication={onChangeApplication}
            isSkipRefresh={isSkipRefresh}
            discardKey={discardKey}
            isEditorEnabled={isEditorEnabled}
            isChanged={isChanged}
            onSave={onTryToSave}
            setIsChanged={setIsChanged}
            setSelectedApplication={setSelectedApplication}
            {...props}
          />
        )}
      </div>

      <EntityViewModals
        isModalOpen={isModalOpen}
        modalType={modalType}
        handleConfirm={onConfirmModal}
        handleClose={onModalClose}
        handleCancel={onCancelModal}
      />
    </div>
  );
};

export default ApplicationView;
