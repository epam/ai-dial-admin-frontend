import { useCallback, useEffect, useState } from 'react';

import { PopUpState } from '@/src/types/pop-up';
import { FieldError } from '@/src/models/error';
import { CreateI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { Container, DEPLOYMENT_ENTITY } from '@/src/models/deployments';
import { ApplicationRoute } from '@/src/types/routes';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { IconExternalLink } from '@tabler/icons-react';
import { getUrlError } from '@/src/utils/validation/url-error';
import { getErrorNotification } from '@/src/utils/notification';
import { useNotification } from '@/src/context/NotificationContext';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import SelectContainerModal from '@/src/components/SourceField/Containers/SelectContainerModal';
import Button from '@/src/components/Common/Button/Button';
import Field from '@/src/components/Common/Field/Field';

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

  const [completionEndpointError, setCompletionEndpointError] = useState<FieldError | null>(null);
  const [configurationEndpointError, setConfigurationEndpointError] = useState<FieldError | null>(null);
  const [endpointError, setEndpointError] = useState<FieldError | null>(null);
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [containers, setcContainers] = useState<Container[]>([]);
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
        setcContainers(containers /*.filter((container) => container.status === 'running')*/ || []);
      }
    };

    fetchContainers().catch((error) => showNotification(getErrorNotification(error.errorHeader, error.errorMessage)));
  }, [getContainers, showNotification]);

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
        {entity.source?.containerId && (
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
              <TextInputField
                textBeforeInput={selectedContainer?.url}
                elementId="endpoint"
                fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
                placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
                value={
                  entity.source.completionEndpointPath || (entity as DialModel).type === DialModelType.Chat
                    ? '/chat/completions'
                    : '/embeddings'
                }
                errorText={endpointError?.text}
                disabled={true}
                invalid={!!endpointError}
                onChange={(completionEndpointPath) => {
                  setEndpointError(getUrlError(`${selectedContainer?.url}${completionEndpointPath}`, t));
                  onChange({
                    ...entity,
                    source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, completionEndpointPath },
                  });
                }}
              />
            </div>
          ) : (
            <div className="lg:w-[35%] flex flex-col gap-6">
              <TextInputField
                textBeforeInput={selectedContainer?.url}
                elementId="completionEndpoint"
                fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
                placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
                value={entity.source.completionEndpointPath}
                errorText={completionEndpointError?.text}
                invalid={!!completionEndpointError}
                onChange={(completionEndpointPath) => {
                  setCompletionEndpointError(getUrlError(`${selectedContainer?.url}${completionEndpointPath}`, t));
                  onChange({
                    ...entity,
                    source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, completionEndpointPath },
                  });
                }}
              />
              <TextInputField
                textBeforeInput={selectedContainer?.url}
                elementId="configurationEndpoint"
                fieldTitle={t(CreateI18nKey.ConfigurationEndpointTitle)}
                placeholder={t(CreateI18nKey.ConfigurationEndpointPlaceholder)}
                value={entity.source.configurationEndpointPath}
                errorText={configurationEndpointError?.text}
                invalid={!!configurationEndpointError}
                onChange={(configurationEndpointPath) => {
                  setConfigurationEndpointError(
                    getUrlError(`${selectedContainer?.url}${configurationEndpointPath}`, t),
                  );
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
