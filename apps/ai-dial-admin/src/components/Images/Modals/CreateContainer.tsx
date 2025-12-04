import { FC, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { ButtonVariant, DialButton, DialPopup } from '@epam/ai-dial-ui-kit';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { useAppContext } from '@/src/context/AppContext';
import { getContainerTemplate, validateContainer } from '@/src/utils/deployments/containers';
import ContainerProperties from '@/src/components/Containers/Properties/ContainerProperties';
import { ButtonsI18nKey } from '@/src/constants/i18n';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onCreate: (container: Container) => void;
  image: Image;
  route: ApplicationRoute;
  names?: string[];
}

const CreateContainer: FC<Props> = ({ onClose, isModalOpen, modalTitle, route, names, onCreate, image }) => {
  const t = useI18n();
  const { resourcesDefaults } = useAppContext();
  const [container, setContainer] = useState<Container>(getContainerTemplate(route, resourcesDefaults) as Container);
  const [isValid, setIsValid] = useState(false);

  const containerClassName = classNames('flex flex-col w-full lg:max-w-[55%] md:max-w-[75%]');

  const onChange = useCallback((container: Container) => {
    setContainer(container);
  }, []);

  useEffect(() => {
    setIsValid(validateContainer(container, route, names || []));
  }, [container, names, route, t]);

  useEffect(() => {
    setContainer((prev) => ({
      ...prev,
      imageDefinitionId: image.id as string,
    }));
  }, [image]);

  return (
    <DialPopup
      onClose={onClose}
      title={modalTitle}
      portalId="createContainerModal"
      open={isModalOpen}
      className={containerClassName}
    >
      <div className="flex flex-col py-4 px-6 overflow-auto max-h-[400px]">
        <ContainerProperties container={container} setContainer={onChange} isModal={true} route={route} names={names} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          label={t(ButtonsI18nKey.Create)}
          onClick={() => {
            onCreate(container);
            onClose();
          }}
          disabled={!isValid}
        />
      </div>
    </DialPopup>
  );
};

export default CreateContainer;
