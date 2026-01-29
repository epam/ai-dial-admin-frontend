import { DialInputPopup, DialNeutralButton, DialSelectField } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Field from '@/src/components/Common/Field/Field';
import SelectContainerModal from '@/src/components/SourceField/Containers/SelectContainerModal';
import Endpoints from '@/src/components/SourceField/Endpoints/Endpoints';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { CreateI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';
import { getErrorNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { addTrailingSlash } from '@/src/utils/url';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getContainers: () => Promise<ServerActionResponse<Container[]>>;
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
  const t = useI18n();
  const { showNotification } = useNotification();
  const { featureFlags } = useAppContext();
  const getReqRef = useRef(useProtectedRequest());
  const showNotificationRef = useRef(showNotification);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  const selectedContainerName = useMemo(() => {
    return containers.find((container) => container.name === entity.source?.containerId)?.name;
  }, [containers, entity.source?.containerId]);

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

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
        updatedEntity.source.completionEndpointPath = `openai/v1${getEndpointPostfix((entity as DialModel).type)}`;
      }
      onChange(updatedEntity);
      onCloseModal();
    },
    [entity, onChange, onCloseModal, view],
  );

  const openContainer = useCallback(() => {
    const route =
      view === ApplicationRoute.Models
        ? ApplicationRoute.ModelServings
        : view === ApplicationRoute.Interceptors
          ? ApplicationRoute.InterceptorContainers
          : ApplicationRoute.McpContainers;
    onOpenInNewTab(route, selectedContainer);
  }, [selectedContainer, view]);

  useEffect(() => {
    const fetchContainers = async () => {
      const containers = (await getReqRef.current(getContainers)).response as Container[] | null;
      if (containers?.length) {
        setContainers(containers.filter((container) => container.status === 'running') || []);
      }
    };

    fetchContainers().catch((error) =>
      showNotificationRef.current(getErrorNotification(error.errorHeader, error.errorMessage, error.requestId)),
    );
  }, [getContainers]);

  useEffect(() => {
    setSelectedContainer(containers?.find((container) => container.name === entity.source?.containerId) || null);
  }, [containers, selectedContainer, entity]);

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex lg:flex-row flex-col gap-2 items-end">
        {isModal ? (
          <div className="flex flex-col w-full">
            <DialSelectField
              searchable={true}
              options={containers.map((container) => ({
                value: container.name as string,
                label: container.displayName,
              }))}
              onChange={(container) => onSelect(container as string)}
              elementId="source-type"
              value={selectedContainerName}
              placeholder={t(CreateI18nKey.SelectContainer)}
              fieldTitle={t(EntityFieldsI18nKey.container)}
              readonly={!featureFlags.deploymentsEnabled}
            />
          </div>
        ) : (
          <div className={classNames('flex gap-2', STANDARD_CONTROL_WIDTH)}>
            <div className={CONTROL_WITH_BUTTON_WIDTH}>
              <Field fieldTitle={t(SourceI18nKey.Container)} htmlFor="containers" />
              <DialInputPopup
                open={isModalOpen}
                onOpen={onOpenModal}
                selectedValue={selectedContainer?.displayName}
                elementId="containers"
                emptyValueText={t(EntitiesI18nKey.NoContainers)}
                disabled={!featureFlags.deploymentsEnabled}
                errorText={errorText}
              >
                <SelectContainerModal
                  selectedId={entity.source?.containerId}
                  onClose={onCloseModal}
                  onApply={onSelect}
                  containers={containers}
                  isModalOpen={isModalOpen}
                />
              </DialInputPopup>
            </div>
            {entity.source?.containerId && featureFlags.deploymentsEnabled && (
              <DialNeutralButton
                iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                className={classNames(errorText ? 'self-center mt-[3px]' : 'self-end', 'shrink-0')}
                label={t(SourceI18nKey.OpenContainer)}
                onClick={() => openContainer()}
              />
            )}
          </div>
        )}
      </div>
      {entity.source?.containerId && selectedContainer && !isModal && (
        <Endpoints
          entity={entity}
          onChange={onChange}
          view={view}
          prefix={addTrailingSlash(selectedContainer?.url || '')}
        />
      )}
    </div>
  );
};

export default Containers;
