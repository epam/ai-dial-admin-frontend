import { FC, useCallback, useEffect, useState } from 'react';
import { ButtonVariant, DialButton, DialNeutralButton, DialPopup } from '@epam/ai-dial-ui-kit';

import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { getContainerTemplate, validateContainer } from '@/src/utils/deployments/containers';
import { getRouteByType } from '@/src/utils/deployments/entity';
import { useI18n } from '@/src/locales/client';

import ContainerProperties from '@/src/components/Containers/Fields/ContainerProperties';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onCreate: (container: Container) => void;
  image: Image;
  names?: string[];
}

const CreateContainer: FC<Props> = ({ onClose, isModalOpen, modalTitle, names, onCreate, image }) => {
  const t = useI18n();
  const { resourcesDefaults } = useAppContext();
  const [container, setContainer] = useState<Container>(
    getContainerTemplate(getRouteByType(image.$type), resourcesDefaults) as Container,
  );
  const [isValid, setIsValid] = useState(false);

  const onChange = useCallback((container: Container) => {
    setContainer(container);
  }, []);

  useEffect(() => {
    setIsValid(validateContainer(container, getRouteByType(image.$type), names || []));
  }, [container, image.$type, names, t]);

  useEffect(() => {
    setContainer((prev) => ({
      ...prev,
      imageDefinitionId: image.id as string,
    }));
  }, [image]);

  return (
    <DialPopup
      onClose={onClose}
      header={modalTitle}
      portalId="createContainerModal"
      open={isModalOpen}
      className="lg:max-w-[55%] md:max-w-[75%]"
    >
      <div className="flex flex-col py-4 px-6 overflow-auto max-h-[400px]">
        <ContainerProperties
          container={container}
          setContainer={onChange}
          isModal={true}
          route={getRouteByType(image.$type)}
          names={names}
        />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
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
