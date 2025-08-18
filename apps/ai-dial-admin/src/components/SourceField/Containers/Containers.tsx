import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { CreateI18nKey, SourceI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Container, DEPLOYMENT_ENTITY } from '@/src/models/deployments';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { getUrlError } from '@/src/utils/validation/url-error';
import { IconExternalLink } from '@tabler/icons-react';

import Button from '@/src/components/Common/Button/Button';
import Field from '@/src/components/Common/Field/Field';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import SelectContainerModal from '@/src/components/SourceField/Containers/SelectContainerModal';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  entity: DialInterceptor;
  onChange: (entity: DialInterceptor) => void;
  getContainers: () => Promise<Container[] | null>;
  fieldId?: string;
}

const Containers: FC<Props> = ({ entity, onChange, getContainers, fieldId }) => {
  const t = useI18n() as (key: string) => string;
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  const { dispatch } = useSaveValidationContext();

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [interceptorContainers, setInterceptorContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  const completionEndpointError = useMemo(() => {
    return entity.source?.completionEndpointPath
      ? getUrlError(`${selectedContainer?.url}${entity.source?.completionEndpointPath}`, false, t)
      : null;
  }, [entity, selectedContainer, t]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'completionEndpoint', isValid: !completionEndpointError });
  }, [completionEndpointError, t, dispatch]);

  const configurationEndpointError = useMemo(() => {
    return entity.source?.configurationEndpointPath
      ? getUrlError(`${selectedContainer?.url}${entity.source?.configurationEndpointPath}`, false, t)
      : null;
  }, [entity, selectedContainer, t]);

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'configurationEndpoint',
      isValid: !configurationEndpointError,
    });
  }, [configurationEndpointError, t, dispatch]);

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
        setInterceptorContainers(containers.filter((container) => container.status === 'running') || []);
      }
    };

    fetchContainers().catch((error) =>
      showNotificationRef.current(getErrorNotification(error.errorHeader, error.errorMessage)),
    );
  }, [getContainers]);

  useEffect(() => {
    setSelectedContainer(
      interceptorContainers?.find((container) => container.id === entity.source?.containerId) || null,
    );
  }, [interceptorContainers, selectedContainer, entity]);

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
              interceptorContainers={interceptorContainers}
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
              onChange({
                ...entity,
                source: { ...entity.source, $type: SOURCE_TYPE.CONTAINER, configurationEndpointPath },
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Containers;
