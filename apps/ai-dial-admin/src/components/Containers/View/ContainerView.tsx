'use client';

import { cloneDeep } from 'lodash';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getContainer, getContainerPods, updateContainer } from '@/src/app/actions/deployments';
import ContainersHeader from '@/src/components/EntityHeaderControls/ContainersHeader';
import { ApiRoute } from '@/src/constants/api-routes';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { IMAGE_BUILD_POLL_INTERVAL } from '@/src/constants/deployments/images';
import { CONTAINER_IGNORED_FIELDS } from '@/src/constants/editor';
import { ErrorI18nKey, ContainersI18nKey, DeploymentsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Container, KubEvent, Pod } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialApplication } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { Toolset } from '@/src/models/dial/toolset';
import { ServerActionResponse } from '@/src/models/server-action';
import { CONTAINER_STATUS, KubEventType } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getContainerRedeploySnapshot } from '@/src/utils/deployments/containers';
import { decodeVariables } from '@/src/utils/deployments/variables';
import { getTranslatedDeploymentType, getTranslatedType } from '@/src/utils/deployments/entity';
import { isImageNotInstalled } from '@/src/utils/deployments/images';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getDeploymentsViewTabs, withFlags } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  container: Container;
  image?: Image;
  route: ApplicationRoute;
  names: string[];
  createEntity?: (entity: DialModel | Toolset | DialInterceptor | DialApplication) => Promise<ServerActionResponse>;
  createEntityAsAsset?: (entity: AssetToolset) => Promise<ServerActionResponse>;
  entityNames?: string[];
}

const ContainerView: FC<Props> = ({
  container,
  image,
  route,
  createEntity,
  createEntityAsAsset,
  entityNames,
  ...props
}) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { disableDeploymentsJSONEditor } = useAppContext();

  const imageNotInstalled = isImageNotInstalled(image);

  const [selectedContainer, setSelectedContainer] = useState<Container>(cloneDeep(container));
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isEditorEnabled, setIsEditorEnabled] = useState<boolean>(false);
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [isRedeployRequired, setIsRedeployRequired] = useState<boolean>(false);
  const [key, setKey] = useState(0);
  const [events, setEvents] = useState<KubEvent[]>([]);
  const [restarts, setRestarts] = useState(0);
  const [pods, setPods] = useState<Pod[]>([]);
  const [hasBlockedDomains, setHasBlockedDomains] = useState<boolean>(false);
  const [hasWarningEvents, setHasWarningEvents] = useState<boolean>(false);

  const tabs = useMemo(() => {
    const baseTabs = getDeploymentsViewTabs(route, t, container.status, container.allowedDomains, imageNotInstalled);
    return withFlags(baseTabs, {
      [EntityViewTab.ExecutionLog]: { invalid: hasBlockedDomains },
      [EntityViewTab.Events]: { invalid: hasWarningEvents },
    });
  }, [container.allowedDomains, container.status, hasBlockedDomains, hasWarningEvents, imageNotInstalled, route, t]);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
      hideJsonEditorButton: disableDeploymentsJSONEditor,
    }),
    [disableDeploymentsJSONEditor, isEditorEnabled],
  );

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      setIsChanged(false);
      // TODO: Revisit solution
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedContainer(cloneDeep(container));
  }, [container, isEditorEnabled]);

  const onSave = useCallback(() => {
    updateContainer(selectedContainer).then(({ success, errorMessage, errorHeader, response, requestId }) => {
      if (success) {
        const updatedContainer = response as Container | undefined;
        if (updatedContainer) {
          setSelectedContainer(decodeVariables(cloneDeep(updatedContainer)));
        }
        router.refresh();
      } else {
        showNotification(getErrorNotification(errorHeader, errorMessage, requestId));
      }
    });
  }, [router, selectedContainer, showNotification]);

  useEffect(() => {
    setSelectedContainer((prev) => {
      const next = cloneDeep(container);
      const isTransitioning = prev.status === CONTAINER_STATUS.PENDING || prev.status === CONTAINER_STATUS.STOPPING;
      if (isTransitioning && container.status === CONTAINER_STATUS.RUNNING) {
        next.status = prev.status;
      }
      return next;
    });
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
      const eventSource = new EventSource(`${ApiRoute.Events}?id=${selectedContainer.name}`);

      const handleEvent = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as KubEvent;
          if (data.eventType === KubEventType.WARNING) {
            setHasWarningEvents(true);
          }
          setEvents((prev) => [...prev, data].sort((a, b) => b.firstTimestamp - a.firstTimestamp));
        } catch (e) {
          console.error('[SSE] Error parsing event: event', e);
        }
      };

      const handleError = (event: Event) => {
        const messageEvent = event as MessageEvent;
        try {
          const { message } = JSON.parse(messageEvent.data);
          showNotification(getErrorNotification(t(ErrorI18nKey.Error), message));
        } catch {
          showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(DeploymentsI18nKey.EventsError)));
        }
        eventSource.close();
      };

      const handleOpen = () => {
        setEvents([]);
      };

      eventSource.addEventListener('event', handleEvent);
      eventSource.addEventListener('error', handleError);
      eventSource.addEventListener('open', handleOpen);

      return () => {
        eventSource.removeEventListener('event', handleEvent);
        eventSource.removeEventListener('error', handleError);
        eventSource.removeEventListener('open', handleOpen);
        eventSource.close();
      };
    }
  }, [selectedContainer.name, showNotification, t]);

  useEffect(() => {
    if (!selectedContainer.name) {
      setPods([]);
      setRestarts(0);
      return;
    }

    const fetchPods = async () => {
      const data = await getContainerPods(selectedContainer.name as string);
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
        <ContainersHeader
          tabs={tabs}
          activeTab={activeTab}
          onChangeActiveTab={setActiveTab}
          route={route}
          container={selectedContainer}
          image={image}
          isChanged={isChanged}
          isRedeployRequired={isRedeployRequired}
          onSave={onSave}
          onDiscard={onDiscard}
          jsonConfiguration={jsonConfiguration}
          createEntity={createEntity}
          createEntityAsAsset={createEntityAsAsset}
          entityNames={entityNames}
        />

        <div className="flex-1 overflow-auto min-h-0">
          {isEditorEnabled ? (
            <EntityJsonEditor
              key={key}
              entity={selectedContainer}
              setSelectedEntity={setSelectedContainer}
              setIsChanged={setIsChanged}
              ignoredFields={CONTAINER_IGNORED_FIELDS}
            />
          ) : (
            <TabsContent
              activeTab={activeTab}
              route={route}
              selectedContainer={selectedContainer}
              events={events}
              onChange={setSelectedContainer}
              pods={pods}
              restarts={restarts}
              image={image}
              setHasBlockedDomains={setHasBlockedDomains}
              {...props}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ContainerView;
