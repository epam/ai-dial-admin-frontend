import { DialInput, DialInputPopup, DialLabel, DialNeutralButton, DialSelectField } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import WarningIcon from '@/src/components/Common/WarningIcon/WarningIcon';
import SelectContainerModal from '@/src/components/SourceField/Containers/SelectContainerModal';
import Endpoints from '@/src/components/SourceField/Endpoints/Endpoints';
import { buildContainerSelection, getContainerRoute } from '@/src/components/SourceField/utils';
import {
  ButtonsI18nKey,
  ContainersI18nKey,
  CreateI18nKey,
  EntitiesI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  SourceI18nKey,
} from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { DialApplication } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { addTrailingSlash } from '@/src/utils/url';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  getContainers: () => Promise<ServerActionResponse<Container[]>>;
  view: ApplicationRoute;
  isModal?: boolean;
  error?: string;
  disabled?: boolean;
}

const Containers = <T extends DialInterceptor | DialModel | DialApplication>({
  entity,
  onChange,
  getContainers,
  view,
  isModal,
  error,
  disabled,
}: Props<T>) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const { featureFlags } = useAppContext();
  const getReqRef = useRef(useProtectedRequest());
  const showNotificationRef = useRef(showNotification);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [currentContainer, setCurrentContainer] = useState<Container | null>(null);

  const isMobile = useIsMobileScreen();

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
      const selected = containers.find((c) => c.name === id);
      onChange(buildContainerSelection(view, entity, id, selected));
      onCloseModal();
    },
    [containers, entity, onChange, onCloseModal, view],
  );

  const openContainer = useCallback(() => {
    if (entity.source?.containerId) {
      onOpenInNewTab(getContainerRoute(view), { name: entity.source.containerId });
    }
  }, [entity.source?.containerId, view]);

  useEffect(() => {
    const fetchContainers = async () => {
      const containers = (await getReqRef.current(getContainers)).response as Container[] | null;
      if (containers?.length) {
        setCurrentContainer(containers.find((c) => c.name === entity.source?.containerId) ?? null);
        setContainers(containers.filter((container) => container.status === 'running'));
      }
    };

    fetchContainers().catch((error) =>
      showNotificationRef.current(getErrorNotification(error.errorHeader, error.errorMessage, error.requestId)),
    );
  }, [entity.source?.containerId, getContainers]);

  useEffect(() => {
    setSelectedContainer(containers?.find((container) => container.name === entity.source?.containerId) || null);
  }, [containers, selectedContainer, entity]);

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex lg:flex-row flex-col gap-2">
        {isModal ? (
          <div className="flex flex-col w-full">
            <DialSelectField
              options={containers.map((container) => ({
                value: container.name as string,
                label: container.displayName as string,
              }))}
              required
              searchable
              onChange={(container) => onSelect(container as string)}
              id="source-type"
              value={selectedContainerName}
              placeholder={t(CreateI18nKey.SelectContainer)}
              label={t(EntityFieldsI18nKey.container)}
              disabled={disabled || !featureFlags.deploymentsEnabled}
            />
          </div>
        ) : (
          <div className="flex gap-2">
            <div className={classNames(CONTROL_WITH_BUTTON_WIDTH, 'flex flex-col gap-y-1')}>
              <DialLabel label={t(SourceI18nKey.Container)} required htmlFor="containers" />
              <DialInputPopup
                open={isModalOpen}
                onOpen={onOpenModal}
                selectedValue={selectedContainer?.displayName || currentContainer?.displayName}
                elementId="containers"
                emptyValueText={t(EntitiesI18nKey.NoContainers)}
                disabled={disabled || !featureFlags.deploymentsEnabled}
                errorText={error}
                iconBefore={
                  currentContainer && currentContainer.status !== CONTAINER_STATUS.RUNNING ? (
                    <WarningIcon warningText={t(ContainersI18nKey.ContainerNotRunningTooltip)} />
                  ) : undefined
                }
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
            {entity.source?.containerId && featureFlags.deploymentsEnabled && !disabled && (
              <DialNeutralButton
                iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                className={classNames(error ? 'self-center mt-[3px]' : 'self-end', 'shrink-0')}
                label={isMobile ? '' : t(ButtonsI18nKey.Open)}
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
          disabled={disabled}
        />
      )}
      {entity.source?.containerId && selectedContainer && isModal && view === ApplicationRoute.Adapters && (
        <div className="flex flex-col gap-y-8">
          <DialInput
            id="completionEndpointPath"
            labelProps={{ label: t(EntityFieldsI18nKey.completionEndpointPath) }}
            placeholder={t(EntityPlaceholdersI18nKey.CompletionEndpointPath)}
            value={entity.source?.completionEndpointPath}
            onChange={(completionEndpointPath) => {
              onChange({
                ...entity,
                source: { ...entity.source, completionEndpointPath },
              });
            }}
          />
          <DialInput
            id="responsesEndpointPath"
            labelProps={{ label: t(EntityFieldsI18nKey.responsesEndpointPath) }}
            placeholder={t(EntityPlaceholdersI18nKey.ResponsesEndpointPath)}
            value={entity.source?.responsesEndpointPath}
            onChange={(responsesEndpointPath) => {
              onChange({
                ...entity,
                source: { ...entity.source, responsesEndpointPath },
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Containers;
