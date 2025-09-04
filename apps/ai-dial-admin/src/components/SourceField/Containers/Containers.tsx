import { useCallback, useEffect, useRef, useState } from 'react';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { Container, DEPLOYMENT_ENTITY } from '@/src/models/deployments';
import { ApplicationRoute } from '@/src/types/routes';
import { DialModel } from '@/src/models/dial/model';
import { SourceI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { getErrorNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { useAppContext } from '@/src/context/AppContext';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { IconExternalLink } from '@tabler/icons-react';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { PopUpState } from '@/src/types/pop-up';

import Button from '@/src/components/Common/Button/Button';
import Field from '@/src/components/Common/Field/Field';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import SelectContainerModal from '@/src/components/SourceField/Containers/SelectContainerModal';
import CompletionEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/CompletionEndpoint';
import ConfigurationEndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/ConfigurationEndpointControl';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getContainers: () => Promise<Container[] | null>;
  fieldId?: string;
  view?: ApplicationRoute;
}

const Containers = <T extends DialInterceptor | DialModel>({
  entity,
  onChange,
  getContainers,
  fieldId,
  view,
}: Props<T>) => {
  const t = useI18n() as (key: string) => string;
  const { showNotification } = useNotification();
  const { embeddedApps } = useAppContext();
  const deploymentsEnabled = embeddedApps?.some((app) => app.name === 'mcp-plugin');
  const showNotificationRef = useRef(showNotification);

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  const onOpenModal = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, [setModalState]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

  const onSelect = useCallback(
    (id?: string) => {
      onChange({
        ...entity,
        endpoint: '',
        configurationEndpoint: '',
        source: {
          ...entity.source,
          $type: entity.source?.$type || SOURCE_TYPE.CONTAINER,
          containerId: id,
        },
      });
      onCloseModal();
    },
    [entity, onChange, onCloseModal],
  );

  const openContainer = useCallback(() => {
    onOpenInNewTab(ApplicationRoute.InterceptorDeployments, selectedContainer, DEPLOYMENT_ENTITY.containers);
  }, [selectedContainer]);

  useEffect(() => {
    const fetchContainers = async () => {
      const containers = await getContainers();
      if (containers?.length) {
        setContainers(containers.filter((container) => container.status === 'running') || []);
      }
    };

    fetchContainers().catch((error) =>
      showNotificationRef.current(getErrorNotification(error.errorHeader, error.errorMessage)),
    );
  }, [getContainers]);

  useEffect(() => {
    setSelectedContainer(containers?.find((container) => container.id === entity.source?.containerId) || null);
  }, [containers, selectedContainer, entity]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex lg:flex-row flex-col gap-2 items-end">
        <div className="flex flex-col lg:w-[35%]">
          <Field fieldTitle={t(SourceI18nKey.Container)} htmlFor={fieldId} />
          <InputModal
            modalState={modalState}
            onOpenModal={onOpenModal}
            selectedValue={selectedContainer?.id}
            elementId={fieldId}
            readonly={!deploymentsEnabled}
          >
            <SelectContainerModal
              selectedId={entity.source?.containerId}
              onClose={onCloseModal}
              onApply={onSelect}
              interceptorContainers={containers}
              modalState={modalState}
            />
          </InputModal>
        </div>
        {entity.source?.containerId && deploymentsEnabled && (
          <Button
            iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
            cssClass="secondary"
            title={t(SourceI18nKey.OpenContainer)}
            onClick={() => openContainer()}
          />
        )}
      </div>
      {entity.source?.containerId && (
        <>
          {view === ApplicationRoute.Models ? (
            <div className="lg:w-[35%] flex flex-col gap-6">
              <CompletionEndpointControl
                endpoint={entity.source.completionEndpointPath}
                textBeforeInput={selectedContainer?.url}
                onChange={(completionEndpointPath) => {
                  onChange({
                    ...entity,
                    source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, completionEndpointPath },
                  });
                }}
              />
            </div>
          ) : (
            <div className="lg:w-[35%] flex flex-col gap-6">
              <CompletionEndpointControl
                endpoint={entity.source.completionEndpointPath}
                textBeforeInput={selectedContainer?.url}
                onChange={(completionEndpointPath) => {
                  onChange({
                    ...entity,
                    source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, completionEndpointPath },
                  });
                }}
              />

              <ConfigurationEndpointControl
                endpoint={entity.source.configurationEndpointPath}
                textBeforeInput={selectedContainer?.url}
                onChange={(configurationEndpointPath) => {
                  onChange({
                    ...entity,
                    source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, configurationEndpointPath },
                  });
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Containers;
