import { FC, useCallback, useEffect, useState } from 'react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { PopUpState } from '@/src/types/pop-up';
import { FieldError } from '@/src/models/error';
import { CreateI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { IconExternalLink } from '@tabler/icons-react';
import { getUrlError } from '@/src/utils/validation/url-error';
import { TextInputField } from '@/src/components/Common/InputField/InputField';

import InputModal from '@/src/components/Common/InputModal/InputModal';
import SelectedContainerModal from '@/src/components/SourceField/InterceptorContainer/SelectedContainerModal';
import Button from '@/src/components/Common/Button/Button';

interface Props {
  containerId?: string;
  template: InterceptorTemplate;
  onChange: (template: InterceptorTemplate) => void;
}

const InterceptorContainer: FC<Props> = ({ template, onChange }) => {
  const t = useI18n() as (key: string) => string;

  const [completionEndpointError, setCompletionEndpointError] = useState<FieldError | null>(null);
  const [configurationEndpointError, setConfigurationEndpointError] = useState<FieldError | null>(null);
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [interceptorContainers, setInterceptorContainers] = useState<any[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<{
    id: string;
    name: string;
    image: string;
    urlPrefix: string;
  } | null>(null);

  const onOpenModal = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, [setModalState]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

  const onSelect = useCallback(
    (id?: string) => {
      onChange({ ...template, interceptorContainerId: id });
      onCloseModal();
    },
    [template, onChange, onCloseModal],
  );

  useEffect(() => {
    //TODO: Fetch interceptor containers
    setInterceptorContainers([
      {
        id: 'container1',
        name: 'Container 1',
        image: 'image1',
        urlPrefix: 'http://container1.example.com/asdasdasd/asd/a/sd/as/da/sd/a/sd',
      },
      { id: 'container2', name: 'Container 2', image: 'image2', urlPrefix: 'http://container2.example.com/' },
      { id: 'container3', name: 'Container 3', image: 'image3', urlPrefix: 'http://container3.example.com/' },
    ]);
  }, []);

  useEffect(() => {
    setSelectedContainer(interceptorContainers.find((container) => container.id === template.interceptorContainerId));
  }, [interceptorContainers, selectedContainer, template]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex lg:flex-row flex-col gap-2">
        <div className="lg:w-[35%]">
          <InputModal modalState={modalState} onOpenModal={onOpenModal} selectedValue={selectedContainer?.id}>
            <SelectedContainerModal
              selectedId={template.interceptorContainerId}
              onClose={onCloseModal}
              onApply={onSelect}
              interceptorContainers={interceptorContainers}
              modalState={modalState}
            />
          </InputModal>
        </div>
        {template.interceptorContainerId && (
          <Button
            iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
            cssClass="secondary"
            title={'Open container'}
          />
        )}
      </div>
      {template.interceptorContainerId && (
        <div className="lg:w-[35%] flex flex-col gap-6">
          <TextInputField
            textBeforeInput={selectedContainer?.urlPrefix}
            elementId="completionEndpoint"
            fieldTitle={t(CreateI18nKey.CompletionEndpointTitle)}
            placeholder={t(CreateI18nKey.CompletionEndpointPlaceholder)}
            value={template.completionEndpoint}
            errorText={completionEndpointError?.text}
            invalid={!!completionEndpointError}
            onChange={(completionEndpoint) => {
              setCompletionEndpointError(getUrlError(`${selectedContainer?.urlPrefix}${completionEndpoint}`, t));
              onChange({ ...template, completionEndpoint });
            }}
          />
          <TextInputField
            textBeforeInput={selectedContainer?.urlPrefix}
            elementId="configurationEndpoint"
            fieldTitle={t(CreateI18nKey.ConfigurationEndpointTitle)}
            placeholder={t(CreateI18nKey.ConfigurationEndpointPlaceholder)}
            value={template.configurationEndpoint}
            errorText={configurationEndpointError?.text}
            invalid={!!configurationEndpointError}
            onChange={(configurationEndpoint) => {
              setConfigurationEndpointError(getUrlError(`${selectedContainer?.urlPrefix}${configurationEndpoint}`, t));
              onChange({ ...template, configurationEndpoint });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default InterceptorContainer;
