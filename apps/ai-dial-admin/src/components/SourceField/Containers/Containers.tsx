import { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { DialButton } from '@epam/ai-dial-ui-kit';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { Container, DEPLOYMENT_ENTITY } from '@/src/models/deployments';
import { ApplicationRoute } from '@/src/types/routes';
import { DialModel } from '@/src/models/dial/model';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { PopUpState } from '@/src/types/pop-up';
import { CreateI18nKey, EntityFieldsI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { getEndpointPostfix } from '@/src/components/ModelView/ModelProperties/utils';
import { useNotification } from '@/src/context/NotificationContext';
import { getErrorNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { useAppContext } from '@/src/context/AppContext';
import { isDeploymentsEnabled } from '@/src/utils/plugins';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { IconExternalLink } from '@tabler/icons-react';

import Field from '@/src/components/Common/Field/Field';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import SelectContainerModal from '@/src/components/SourceField/Containers/SelectContainerModal';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import Endpoints from '@/src/components/SourceField/Endpoints/Endpoints';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getContainers: () => Promise<Container[] | null>;
  view?: ApplicationRoute;
  isModal?: boolean;
  errorText?: string;
}

const Containers = <T extends DialInterceptor | DialModel>({
  entity,
  onChange,
  getContainers,
  view,
  isModal,
  errorText,
}: Props<T>) => {
  const t = useI18n() as (key: string) => string;
  const { showNotification } = useNotification();
  const { embeddedApps } = useAppContext();
  const deploymentsEnabled = isDeploymentsEnabled(embeddedApps);
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
      const updatedEntity = {
        ...entity,
        endpoint: '',
        configurationEndpoint: '',
        source: {
          ...entity.source,
          $type: entity.source?.$type || SOURCE_TYPE.CONTAINER,
          containerId: id,
        },
      };
      if (view === ApplicationRoute.Models) {
        updatedEntity.source.completionEndpointPath =
          entity.source?.completionEndpointPath || getEndpointPostfix((entity as DialModel).type);
      }
      onChange(updatedEntity);
      onCloseModal();
    },
    [entity, onChange, onCloseModal, view],
  );

  const openContainer = useCallback(() => {
    const route =
      view === ApplicationRoute.Models
        ? ApplicationRoute.ModelDeployments
        : view === ApplicationRoute.Interceptors
          ? ApplicationRoute.InterceptorDeployments
          : ApplicationRoute.McpDeployments;
    onOpenInNewTab(route, selectedContainer, DEPLOYMENT_ENTITY.containers);
  }, [selectedContainer, view]);

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
        {isModal ? (
          <div className="flex flex-col w-full">
            <DropdownField
              items={containers.map((container) => ({ id: container.id, name: container.name }))}
              onChange={onSelect}
              elementId={'source-type'}
              selectedValue={containers.find((container) => container.id === entity.source?.containerId)?.id}
              placeholder={t(CreateI18nKey.SelectContainer)}
              fieldTitle={t(EntityFieldsI18nKey.container)}
              readonly={!deploymentsEnabled}
            />
          </div>
        ) : (
          <div className="flex flex-col lg:w-[35%]">
            <Field fieldTitle={t(SourceI18nKey.Container)} htmlFor={'containers'} />
            <InputModal
              modalState={modalState}
              onOpenModal={onOpenModal}
              selectedValue={selectedContainer?.name}
              elementId={'containers'}
              readonly={!deploymentsEnabled}
              errorText={errorText}
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
        )}
        {entity.source?.containerId && deploymentsEnabled && !isModal && (
          <DialButton
            iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
            cssClass={classNames('secondary', errorText ? 'self-center mt-[3px]' : 'self-end')}
            title={t(SourceI18nKey.OpenContainer)}
            onClick={() => openContainer()}
          />
        )}
      </div>
      {entity.source?.containerId && selectedContainer && !isModal && (
        <Endpoints entity={entity} onChange={onChange} view={view} prefix={`${selectedContainer?.url}/`} />
      )}
    </div>
  );
};

export default Containers;
