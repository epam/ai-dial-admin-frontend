'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  VisualizerConnectorEvents,
  VisualizerConnectorRequest,
  VisualizerConnectorRequests,
} from '@epam/ai-dial-shared';
import { TabModel } from '@epam/ai-dial-ui-kit';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';
import { cloneDeep } from 'lodash';

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
import EntityViewModals from '@/src/components/EntityView/Modals/EntityViewModals';
import { isDisableRole } from '@/src/components/EntityView/Roles/utils';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialAttachmentData } from '@/src/models/attachment-data';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();
  const [isIframeChanged, setIsIframeChanged] = useState(false);

  const [selectedApplication, setSelectedApplication] = useState(cloneDeep(originalApplication));
  const [isChanged, setIsChanged] = useState(false);
  const [nextTab, setNextTab] = useState<string>();
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreApplication, setCoreApplication] = useState<DialApplication | null>(null);

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
    if (originalApplication.mcp?.endpoint) {
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
        ? cloneDeep(coreApplication as DialApplication)
        : cloneDeep(originalApplication),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalApplication]);

  useEffect(() => {
    const isEqualAdminApplication = isEqualSkippingUndefined(originalApplication, selectedApplication);
    const isEqualCoreApplication = isEqualSkippingUndefined(selectedApplication, coreApplication);
    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreApplication : !isEqualAdminApplication);
  }, [selectedFormat, originalApplication, selectedApplication, coreApplication]);

  const handleMessage = useCallback(
    (event: MessageEvent<VisualizerConnectorRequest>) => {
      if (event.data?.type?.split('/')[1] !== VisualizerConnectorEvents.sendMessage) return;
      setIsIframeChanged((event.data as { payload: { isChanged: boolean } }).payload.isChanged);
    },
    [setIsIframeChanged],
  );

  const sendMessage = useCallback(async (visualizer?: VisualizerConnector | null) => {
    const messagePayload: DialAttachmentData = {
      mimeType: APPLICATION_JSON_TYPE,
      visualizerData: {
        saveChanges: true,
        layout: { width: 0, height: 0 },
      },
    };
    visualizer?.send(VisualizerConnectorRequests.sendVisualizeData, messagePayload);
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      setSelectedFormat(ExportFormat.ADMIN);
    }

    setSelectedApplication(originalApplication);
    setIsSkipRefresh(false);
  }, [isEditorEnabled, originalApplication]);

  const onChangeApplication = useCallback(
    (entity: DialApplication, skipRefresh?: boolean) => {
      setSelectedApplication(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedApplication],
  );

  const onModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalType(void 0);
  }, []);

  const onChangeTab = useCallback(() => {
    setActiveTab(nextTab as EntityViewTab);
    setNextTab(void 0);
  }, [nextTab]);

  const onModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setIsModalOpen(true);
  }, []);

  const onModalCancel = useCallback(
    (type: ModalType) => {
      if (type === ModalType.entity) {
        onDiscard();
        onModalClose();
        onChangeTab();
      }
      if (type === ModalType.parameters) {
        onModalClose();
        onChangeTab();
      }
      if (type === ModalType.emptyRoles) {
        onModalClose();
      }
    },
    [onChangeTab, onModalClose, onDiscard],
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

  const onModalConfirm = useCallback(
    (type: ModalType) => {
      if (type === ModalType.entity) {
        onSave();
        onModalClose();
        onChangeTab();
      }
      if (type === ModalType.parameters) {
        sendMessage(visualizerConnector);
        onModalClose();
        // need to wait saving until change tab
        setTimeout(() => {
          onChangeTab();
        }, 2000);
      }
      if (type === ModalType.emptyRoles) {
        onSave();
        onModalClose();
      }
    },
    [onChangeTab, onModalClose, onSave, sendMessage, visualizerConnector],
  );

  const onChangeActiveTab = useCallback(
    (tab: EntityViewTab) => {
      if (tab === EntityViewTab.Parameters && isChanged) {
        setNextTab(tab);
        onModalOpen(ModalType.entity);
      } else if (activeTab === EntityViewTab.Parameters && (isIframeChanged || isChanged)) {
        setNextTab(tab);
        onModalOpen(ModalType.parameters);
      } else {
        setActiveTab(tab);
      }
    },
    [activeTab, onModalOpen, isChanged, isIframeChanged],
  );

  const onTryToSave = useCallback(() => {
    if (selectedFormat !== ExportFormat.CORE && isDisableRole(selectedApplication as EntityRoleLimits)) {
      onModalOpen(ModalType.emptyRoles);
    } else {
      onSave();
    }
  }, [onModalOpen, selectedFormat, onSave, selectedApplication]);

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
            entity={selectedApplication}
            setSelectedEntity={setSelectedApplication}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            view={ApplicationRoute.Applications}
            activeTab={activeTab}
            selectedApplication={selectedApplication}
            originalApplication={originalApplication}
            onChangeApplication={onChangeApplication}
            isSkipRefresh={isSkipRefresh}
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
        handleConfirm={onModalConfirm}
        handleClose={onModalClose}
        handleCancel={onModalCancel}
      />
    </div>
  );
};

export default ApplicationView;
