'use client';

import Tabs from '@/src/components/Common/Tabs/Tabs';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { ModalType } from '@/src/components/EntityView/Modals/constants';
import EntityViewModals from '@/src/components/EntityView/Modals/EntityViewModals';
import { isDisableRole } from '@/src/components/EntityView/Roles/utils';
import { EntityViewTab, getIsParametersTabAvailable, getViewTabs } from '@/src/components/EntityView/View/utils';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAttachmentData } from '@/src/models/attachment-data';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity, EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { ServerActionResponse } from '@/src/models/server-action';
import { JSONEditorErrorNotification } from '@/src/types/editor';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification } from '@/src/utils/notification';
import {
  VisualizerConnectorEvents,
  VisualizerConnectorRequest,
  VisualizerConnectorRequests,
} from '@epam/ai-dial-shared';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';
import classNames from 'classnames';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';
import ViewContent from './ViewContent';

interface Props {
  view: ApplicationRoute;
  originalEntity: BaseEntity;
  names: string[];
  etag?: string;
  roles?: DialRole[] | null;
  applicationSchemes?: DialApplicationScheme[] | null;
  interceptors?: DialInterceptor[] | null;
  applications?: DialApplication[] | null;
  models?: DialModel[] | null;
  updateEntity: (entity: BaseEntity, etag?: string) => Promise<ServerActionResponse>;
  removeEntity: (entity?: string) => Promise<ServerActionResponse>;
}

const EntityView: FC<Props> = ({
  originalEntity,
  names,
  applicationSchemes,
  view,
  etag,
  updateEntity,
  removeEntity,
  ...props
}) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const { dispatch } = useSaveValidationContext();
  const isParametersTabAvailable = getIsParametersTabAvailable(originalEntity as DialApplication, applicationSchemes);

  const tabs = getViewTabs(t, view, isParametersTabAvailable);
  const router = useRouter();
  const { showNotification } = useNotification();

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [modalType, setModalType] = useState<ModalType>();

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [nextTab, setNextTab] = useState<string>();
  const [selectedEntity, setSelectedEntity] = useState(cloneDeep(originalEntity));
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [isIframeChanged, setIsIframeChanged] = useState<boolean>(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState<boolean>(true);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [errorNotifications, setErrorNotifications] = useState<JSONEditorErrorNotification[]>([]);
  const [key, setKey] = useState(0);

  const { visualizerConnector } = useAppContext();

  useEffect(() => {
    setSelectedEntity(cloneDeep(originalEntity));
  }, [originalEntity]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  const handleModalClose = useCallback(() => {
    setModalState(PopUpState.Closed);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setModalState(PopUpState.Opened);
  }, []);

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
    setIsChanged(!isEqualSkippingUndefined(originalEntity, selectedEntity));
  }, [selectedEntity, originalEntity]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      if (tab !== activeTab) {
        if (tab === EntityViewTab.Parameters && isChanged && view === ApplicationRoute.Applications) {
          setNextTab(tab);
          handleModalOpen(ModalType.entity);
        } else if (
          activeTab === EntityViewTab.Parameters &&
          isIframeChanged &&
          view === ApplicationRoute.Applications
        ) {
          setNextTab(tab);
          handleModalOpen(ModalType.parameters);
        } else {
          setActiveTab(tab as EntityViewTab);
        }
      }
    },
    [activeTab, handleModalOpen, isChanged, isIframeChanged, view],
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
    setSelectedEntity(cloneDeep(originalEntity));
    setIsSkipRefresh(false);
  }, [jsonEditorEnabled, originalEntity, dispatch]);

  const onSave = useCallback(() => {
    updateEntity(selectedEntity, etag).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedEntity, updateEntity, etag, router, showNotification]);

  const onTryToSave = useCallback(() => {
    if (
      (view === ApplicationRoute.Models || view === ApplicationRoute.Applications) &&
      isDisableRole(selectedEntity as EntityRoleLimits)
    ) {
      handleModalOpen(ModalType.emptyRoles);
    } else {
      onSave();
    }
  }, [handleModalOpen, onSave, selectedEntity, view]);

  const onChangeEntity = useCallback(
    (entity: BaseEntity, skipRefresh?: boolean) => {
      setSelectedEntity(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedEntity],
  );

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const changeTab = useCallback(() => {
    setActiveTab(nextTab as EntityViewTab);
    setNextTab(void 0);
  }, [nextTab]);

  const handleModalConfirm = useCallback(
    (type: ModalType) => {
      if (type === ModalType.entity) {
        onSave();
        handleModalClose();
        changeTab();
      }
      if (type === ModalType.parameters) {
        sendMessage(visualizerConnector);
        handleModalClose();
        // need to wait saving until change tab
        setTimeout(() => {
          changeTab();
        }, 2000);
      }
      if (type === ModalType.emptyRoles) {
        onSave();
        handleModalClose();
      }
    },
    [changeTab, handleModalClose, onSave, sendMessage, visualizerConnector],
  );

  const handleModalCancel = useCallback(
    (type: ModalType) => {
      if (type === ModalType.entity) {
        onDiscard();
        handleModalClose();
        changeTab();
      }
      if (type === ModalType.parameters) {
        handleModalClose();
        changeTab();
      }
      if (type === ModalType.emptyRoles) {
        handleModalClose();
      }
    },
    [changeTab, handleModalClose, onDiscard],
  );

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <div className={headerClassName}>
          <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
          <HeaderButtons
            view={view}
            entity={selectedEntity}
            isChanged={isChanged}
            onSave={onTryToSave}
            onDiscard={onDiscard}
            removeEntity={removeEntity}
            jsonEditorEnabled={jsonEditorEnabled}
            toggleJsonEditor={toggleJsonEditor}
            setErrorNotifications={setErrorNotifications}
          />
        </div>

        <div className="flex-1 overflow-auto mt-3 min-h-0">
          {jsonEditorEnabled && activeTab !== EntityViewTab.Parameters ? (
            <EntityJsonEditor
              key={key}
              entity={selectedEntity}
              errorNotifications={errorNotifications}
              setSelectedEntity={setSelectedEntity}
              setIsChanged={setIsChanged}
            />
          ) : (
            <ViewContent
              view={view}
              applicationSchemes={applicationSchemes}
              activeTab={activeTab}
              names={names}
              selectedEntity={selectedEntity}
              jsonEditorEnabled={jsonEditorEnabled}
              isSkipRefresh={isSkipRefresh}
              onChangeEntity={onChangeEntity}
              {...props}
            />
          )}
        </div>
      </div>
      <EntityViewModals
        modalState={modalState}
        modalType={modalType}
        handleConfirm={handleModalConfirm}
        handleClose={handleModalClose}
        handleCancel={handleModalCancel}
      />
    </>
  );
};

export default EntityView;
