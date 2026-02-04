import { DialConfirmationPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { getContainerTemplate } from '@/src/utils/deployments/containers';
import { getRouteByType } from '@/src/utils/deployments/entity';

import ContainerProperties from '@/src/components/Containers/Fields/ContainerProperties';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onCreate: (container: Container) => void;
  image: Image;
  names?: string[];
}

const ImageCreateContainer: FC<Props> = ({ onClose, isModalOpen, modalTitle, names, onCreate, image }) => {
  const t = useI18n();
  const { resourcesDefaults } = useAppContext();
  const { isValid } = useSaveValidationContext();
  const type = useMemo(
    () => (image.$type === IMAGE_TYPE.MCP ? CONTAINER_TYPE.MCP : CONTAINER_TYPE.INTERCEPTOR),
    [image],
  );

  const [container, setContainer] = useState<Container>(getContainerTemplate(type, resourcesDefaults) as Container);

  const onChange = useCallback((container: Container) => {
    setContainer(container);
  }, []);

  useEffect(() => {
    setContainer((prev) => ({
      ...prev,
      imageDefinitionId: image.id as string,
    }));
  }, [image]);

  return (
    <DialConfirmationPopup
      onClose={onClose}
      header={modalTitle}
      portalId="createContainerModal"
      open={isModalOpen}
      size={PopupSize.Lg}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      confirmLabel={t(ButtonsI18nKey.Create)}
      onCancel={onClose}
      disableConfirmButton={!isValid}
      onConfirm={() => {
        onCreate(container);
        onClose();
      }}
    >
      <div className="flex flex-col py-4 px-6 overflow-auto">
        <ContainerProperties
          container={container}
          setContainer={onChange}
          isModal={true}
          route={getRouteByType(image.$type)}
          names={names}
        />
      </div>
    </DialConfirmationPopup>
  );
};

export default ImageCreateContainer;
