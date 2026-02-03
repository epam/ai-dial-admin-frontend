'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/navigation';
import { TabModel } from '@epam/ai-dial-ui-kit';
import { Container, KubEvent, Pod } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { DialModel } from '@/src/models/dial/model';
import { Toolset } from '@/src/models/dial/toolset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ServerActionResponse } from '@/src/models/server-action';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { useI18n } from '@/src/locales/client';
import { useNotification } from '@/src/context/NotificationContext';
import { useAppContext } from '@/src/context/AppContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { EntityViewTab, getDeploymentsViewTabs } from '@/src/utils/tabs/utils';
import { getContainer, getContainerPods, updateContainer } from '@/src/app/actions/deployments';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { CONTAINER_STATUS, KubEventType } from '@/src/types/deployments/containers';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { getTranslatedDeploymentType, getTranslatedType } from '@/src/utils/deployments/entity';
import { IMAGE_BUILD_POLL_INTERVAL } from '@/src/constants/deployments/images';
import HeaderButtons from '@/src/components/Containers/View/HeaderButtons';
import Properties from '@/src/components/Containers/View/Properties/Properties';
import Tools from '@/src/components/Tools/Tools';
import Resources from '@/src/components/Containers/View/Resources/Resources';
import Prompts from '@/src/components/Containers/View/Prompts/Prompts';
import Metrics from '@/src/components/Containers/View/Metrics/Metrics';
import ExecutionLog from '@/src/components/Containers/View/ExecutionLog/ExecutionLog';
import Events from '@/src/components/Containers/View/Events/Events';
import { BaseEntity } from '@/src/models/dial/base-entity';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import { getContainerRedeploySnapshot } from '@/src/utils/deployments/containers';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import FirewallSettings from '@/src/components/Containers/View/FirewallSettings/FirewallSettings';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';

interface Props {
  container: Container;
  image?: Image;
  route: ApplicationRoute;
  names: string[];
  createEntity: (entity: DialModel | Toolset | DialInterceptor) => Promise<ServerActionResponse>;
  createEntityAsAsset?: (entity: AssetToolset) => Promise<ServerActionResponse>;
  entityNames: string[];
}

const ContainerView: FC<Props> = ({
  container,
  route,
  image,
  names,
  createEntity,
  createEntityAsAsset,
  entityNames,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { disableDeploymentsJSONEditor } = useAppContext();
  const { dispatch } = useSaveValidationContext();

  const [tabs, setTabs] = useState<TabModel[]>(getDeploymentsViewTabs(route, t, container.status));
  const [selectedContainer, setSelectedContainer] = useState<Container>(cloneDeep(container));
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [isRedeployRequired, setIsRedeployRequired] = useState<boolean>(false);
  const [key, setKey] = useState(0);
  const [events, setEvents] = useState<KubEvent[]>([]);
  const [restarts, setRestarts] = useState(0);
  const [pods, setPods] = useState<Pod[]>([]);

  useEffect(() => {
    setTabs(getDeploymentsViewTabs(route, t, container.status));
  }, [container.status, route, t]);

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onDiscard = useCallback(() => {
    if (jsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      // TODO: Revisit solution
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    dispatch({ type: ValidationActionType.Reset });
    setSelectedContainer(cloneDeep(container));
  }, [container, dispatch, jsonEditorEnabled]);

  const onSave = useCallback(() => {
    updateContainer(selectedContainer).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [router, selectedContainer, showNotification]);

  useEffect(() => {
    setSelectedContainer(cloneDeep(container));
  }, [container]);

  useEffect(() => {
    const { status: __status, url: __URL, ...compareContainer } = container;
    const { status: __selectedStatus, url: __selectedURL, ...compareSelectedContainer } = selectedContainer;
    setIsChanged(!isEqualSkippingUndefined(compareContainer, compareSelectedContainer));
    setIsRedeployRequired(
      container.status === CONTAINER_STATUS.RUNNING &&
        !isEqualSkippingUndefined(
          getContainerRedeploySnapshot(container),
          getContainerRedeploySnapshot(selectedContainer),
        ),
    );
  }, [container, selectedContainer]);

  useEffect(() => {
    if (selectedContainer.name) {
      const eventSource = new EventSource(`/api/events?id=${selectedContainer.name}`);

      eventSource.addEventListener('event', (event) => {
        const data = JSON.parse(event.data) as KubEvent;
        if (data.eventType === KubEventType.WARNING) {
          setTabs((prev) => {
            return prev.map((tab) => {
              if (tab.id === EntityViewTab.Events) {
                return { ...tab, invalid: true };
              }
              return tab;
            });
          });
        }
        setEvents((prev) => [...prev, data].sort((a, b) => b.firstTimestamp - a.firstTimestamp));
      });

      return () => {
        eventSource.close();
      };
    }
  }, [selectedContainer.name]);

  useEffect(() => {
    if (!selectedContainer.name) {
      setPods([]);
      setRestarts(0);
      return;
    }

    const fetchPods = async () => {
      const data = await getContainerPods(selectedContainer.name);
      setPods(data || []);
      const totalRestarts = data?.reduce((sum, p) => sum + (p?.restartCount || 0), 0);
      setRestarts(totalRestarts || 0);
    };

    fetchPods();
    const intervalId = window.setInterval(fetchPods, 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedContainer.name, setRestarts]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (
      selectedContainer.status === CONTAINER_STATUS.PENDING ||
      selectedContainer.status === CONTAINER_STATUS.STOPPING
    ) {
      interval = setInterval(async () => {
        const { response, success, requestId } = await getContainer(selectedContainer.name as string);
        if (success && response) {
          const updatedContainer = response as Container;
          setSelectedContainer((prev) => ({
            ...prev,
            status: updatedContainer.status,
          }));
          if (
            updatedContainer.status !== CONTAINER_STATUS.PENDING &&
            updatedContainer.status !== CONTAINER_STATUS.STOPPING &&
            interval
          ) {
            clearInterval(interval);
            if (selectedContainer.status === CONTAINER_STATUS.PENDING) {
              if (updatedContainer.status === CONTAINER_STATUS.RUNNING) {
                showNotification(
                  getSuccessNotification(
                    t(ContainersI18nKey.ContainerRunSuccess, {
                      type: getTranslatedType(route, t),
                      entityType: getTranslatedDeploymentType(route, t),
                    }),
                    t(ContainersI18nKey.ContainerSuccessDescription),
                    5000,
                  ),
                );
              }
              if (updatedContainer.status === CONTAINER_STATUS.FAILED) {
                showNotification(
                  getErrorNotification(
                    t(ContainersI18nKey.ContainerRunFailed, { type: getTranslatedType(route, t) }),
                    '',
                    requestId,
                    5000,
                  ),
                );
              }
            }
            if (
              selectedContainer.status === CONTAINER_STATUS.STOPPING &&
              updatedContainer.status === CONTAINER_STATUS.STOPPED
            ) {
              showNotification(
                getSuccessNotification(
                  t(ContainersI18nKey.ContainerStopSuccess, {
                    type: getTranslatedType(route, t),
                    entityType: getTranslatedDeploymentType(route, t),
                  }),
                  '',
                  5000,
                ),
              );
            }
            router.refresh();
          }
        }
      }, IMAGE_BUILD_POLL_INTERVAL);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedContainer, route, t, showNotification, router]);

  useEffect(() => {
    if (tabs.find((tab) => tab.id === activeTab)?.disabled) {
      setActiveTab(tabs[0].id as EntityViewTab);
    }
  }, [activeTab, tabs]);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <div className={getViewHeaderClassName(jsonEditorEnabled)}>
          <Tabs
            tabs={tabs}
            isEditorEnabled={jsonEditorEnabled}
            activeTab={activeTab}
            onChangeActiveTab={setActiveTab}
          />

          <HeaderButtons
            route={route}
            container={selectedContainer}
            isChanged={isChanged}
            isRedeployRequired={isRedeployRequired}
            onSave={onSave}
            onDiscard={onDiscard}
            jsonEditorEnabled={jsonEditorEnabled}
            toggleJsonEditor={toggleJsonEditor}
            hideJsonEditor={disableDeploymentsJSONEditor}
            createEntity={createEntity}
            createEntityAsAsset={createEntityAsAsset}
            entityNames={entityNames}
            transport={container.transport}
          />
        </div>
        <div className="flex-1 overflow-auto min-h-0">
          {jsonEditorEnabled ? (
            <>
              <EntityJsonEditor
                key={key}
                entity={selectedContainer as BaseEntity}
                setSelectedEntity={setSelectedContainer as Dispatch<SetStateAction<BaseEntity>>}
                setIsChanged={setIsChanged}
              />
            </>
          ) : (
            <>
              {activeTab === EntityViewTab.Properties && (
                <Properties
                  container={selectedContainer}
                  setContainer={setSelectedContainer}
                  image={image}
                  route={route}
                  names={names}
                  originalName={container.name}
                  restarts={restarts}
                />
              )}
              {activeTab === EntityViewTab.Tools && <Tools containerId={selectedContainer.name} isMcpToolset />}
              {activeTab === EntityViewTab.Resources && <Resources containerId={selectedContainer.name} />}
              {activeTab === EntityViewTab.Prompts && <Prompts containerId={selectedContainer.name} />}
              {activeTab === EntityViewTab.Metrics && <Metrics />}
              {activeTab === EntityViewTab.ExecutionLog && (
                <ExecutionLog containerId={selectedContainer.name} route={route} pods={pods} />
              )}
              {activeTab === EntityViewTab.Events && <Events route={route} events={events} />}
              {activeTab === EntityViewTab.Firewall && (
                <FirewallSettings route={route} container={selectedContainer} setContainer={setSelectedContainer} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ContainerView;
