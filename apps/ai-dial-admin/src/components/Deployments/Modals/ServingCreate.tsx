'use client';

import { FC, useState } from 'react';
import { DialFormPopup } from '@epam/ai-dial-ui-kit';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { getContainerTemplate } from '@/src/utils/deployments/containers';
import { useAppContext } from '@/src/context/AppContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import ContainerFields from '@/src/components/Containers/Fields/ContainerFields';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (instance: Container) => void;
  route: ApplicationRoute;
  names: string[];
  header: string;
  type: CONTAINER_TYPE;
}

const ServingCreate: FC<Props> = ({ isModalOpen, onClose, onApply, route, names, header, type }) => {
  const t = useI18n();
  const { resourcesDefaults } = useAppContext();
  const { isValid } = useSaveValidationContext();

  const [container, setContainer] = useState<Container>(getContainerTemplate(type, resourcesDefaults) as Container);

  return (
    <DialFormPopup
      portalId="ServingCreateModal"
      open={isModalOpen}
      header={header}
      onClose={onClose}
      onSubmit={() => onApply(container)}
      onCancel={onClose}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!isValid}
    >
      <div className="flex flex-col px-6 py-4 gap-4 h-full">
        <ContainerFields container={container} setContainer={setContainer} route={route} names={names} isModal={true} />
      </div>
    </DialFormPopup>
  );
};

export default ServingCreate;
