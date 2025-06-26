'use client';

import ApplicationParametersTab from '@/src/components/ApplicationParametersTab/ApplicationParametersTab';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import EntityProperties from '@/src/components/EntityProperties/EntityProperties';
import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import ModelProperties from '@/src/components/ModelView/ModelProperties/ModelProperties';
import RouteProperties from '@/src/components/RoutesList/RouteProperties';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialRole } from '@/src/models/dial/role';
import { DialRoute } from '@/src/models/dial/route';
import { ServerActionResponse } from '@/src/models/server-action';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import {
  VisualizerConnectorEvents,
  VisualizerConnectorRequest,
  VisualizerConnectorRequests,
} from '@epam/ai-dial-shared';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';
import classNames from 'classnames';
import { cloneDeep, isEqual } from 'lodash';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';
import { EntityViewTab, getViewTabs } from './entity-view';
import EntityViewHeaderButtons from './EntityViewHeaderButtons';
import EntityViewModals, { ModalType } from './EntityViewModals';
import EntityFeatures from './Features/Features';
import EntityInterceptors from './Interceptors/Interceptors';
import EntityRoles from './Roles/Roles';
import EntityDashboard from '@/src/components/EntityView/Dashboard/Dashboard';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { DialAttachmentData } from '@/src/models/attachment-data';

interface Props {
  view: ApplicationRoute;
  originalEntity: DialBaseEntity;
  names: string[];
  roles?: DialRole[] | null;
  applicationSchemes?: DialApplicationScheme[] | null;
  interceptors?: DialInterceptor[] | null;
  updateEntity: (entity: DialBaseEntity) => Promise<ServerActionResponse>;
  removeEntity: (entity?: string) => Promise<ServerActionResponse>;
}

const EntityView: FC<Props> = ({
  originalEntity,
  names,
  roles,
  interceptors,
  applicationSchemes,
  view,
  updateEntity,
  removeEntity,
}) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const { featureFlags } = useAppContext();
  const isParametersTabAvailable =
    !!(originalEntity as DialApplication).customAppSchemaId &&
    !!applicationSchemes?.find((s) => s.$id === (originalEntity as DialApplication).customAppSchemaId)?.[
      'dial:applicationTypeEditorUrl'
    ];
  const tabs = getViewTabs(t, view, isParametersTabAvailable, featureFlags);
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
  const [jsonErrors, setJsonErrors] = useState<JSONEditorError[]>([]);
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
    setIsChanged(!isEqual(originalEntity, selectedEntity));
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
      setJsonErrors([]);
      setIsChanged(false);
      // TODO: Revisit solution
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedEntity(cloneDeep(originalEntity));
    setIsSkipRefresh(false);
  }, [setSelectedEntity, originalEntity, jsonEditorEnabled]);

  const onSave = useCallback(() => {
    updateEntity(selectedEntity).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedEntity, updateEntity, router, showNotification]);

  const onTryToSave = useCallback(() => {
    if (
      (view === ApplicationRoute.Models || view === ApplicationRoute.Applications) &&
      !Object.keys(selectedEntity.roleLimits || {}).length
    ) {
      handleModalOpen(ModalType.emptyRoles);
    } else {
      onSave();
    }
  }, [handleModalOpen, onSave, selectedEntity, view]);

  const onChangeEntity = useCallback(
    (entity: DialBaseEntity, skipRefresh?: boolean) => {
      setSelectedEntity(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedEntity],
  );

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const getPropertiesView = useCallback(() => {
    if (view === ApplicationRoute.Models) {
      return <ModelProperties model={selectedEntity} modelsNames={names} updateModel={onChangeEntity} />;
    }

    if (view === ApplicationRoute.Routes) {
      return <RouteProperties route={selectedEntity as DialRoute} updateRoute={onChangeEntity} />;
    }

    return (
      <EntityProperties
        entity={selectedEntity}
        runners={applicationSchemes || []}
        names={names}
        view={view}
        updateEntity={onChangeEntity}
      />
    );
  }, [onChangeEntity, selectedEntity, applicationSchemes, names, view]);

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
          <EntityViewHeaderButtons
            view={view}
            entity={selectedEntity}
            isChanged={isChanged}
            onSave={onTryToSave}
            onDiscard={onDiscard}
            removeEntity={removeEntity}
            jsonEditorEnabled={jsonEditorEnabled}
            toggleJsonEditor={toggleJsonEditor}
            jsonErrors={jsonErrors}
            setErrorNotifications={setErrorNotifications}
          />
        </div>
        <div className="flex-1 overflow-auto mt-3 min-h-0">
          {jsonEditorEnabled && activeTab !== EntityViewTab.Parameters ? (
            <JSONEditor
              key={key}
              model={selectedEntity}
              errorNotifications={errorNotifications}
              setSelectedEntity={setSelectedEntity}
              setIsChanged={setIsChanged}
              setJsonErrors={setJsonErrors}
            />
          ) : (
            <>
              {activeTab === EntityViewTab.Properties && getPropertiesView()}
              {activeTab === EntityViewTab.Features && (
                <EntityFeatures entity={selectedEntity} onChangeEntity={onChangeEntity} />
              )}
              {activeTab === EntityViewTab.Parameters && (
                <ApplicationParametersTab
                  entity={selectedEntity}
                  applicationSchemes={applicationSchemes}
                  jsonEditorEnabled={jsonEditorEnabled}
                />
              )}
              {activeTab === EntityViewTab.Roles && (
                <EntityRoles
                  view={view}
                  entity={selectedEntity}
                  roles={roles || []}
                  onChangeEntity={onChangeEntity}
                  isSkipRefresh={isSkipRefresh}
                />
              )}
              {activeTab === EntityViewTab.Interceptors && (
                <EntityInterceptors
                  entity={selectedEntity}
                  interceptors={interceptors || []}
                  onChangeEntity={onChangeEntity}
                />
              )}
              {activeTab === EntityViewTab.Dashboard && <EntityDashboard entity={selectedEntity} view={view} />}
            </>
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
