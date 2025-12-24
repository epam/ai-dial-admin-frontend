'use client';

import { FC, useState } from 'react';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { getContainerTemplate } from '@/src/utils/deployments/containers';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import ServingProperties from '@/src/components/Containers/Fields/ServingProperties';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (instance: Container) => void;
  route: ApplicationRoute;
  names: string[];
}

const CreateServing: FC<Props> = ({ isModalOpen, onClose, onApply, route, names }) => {
  const t = useI18n();
  const { resourcesDefaults } = useAppContext();
  const { isValid } = useSaveValidationContext();

  const [container, setContainer] = useState<Container>(getContainerTemplate(route, resourcesDefaults) as Container);

  return (
    <DialFormPopup
      portalId="CreateServing"
      open={isModalOpen}
      header={t(CreateI18nKey.CreateServing)}
      onClose={onClose}
      onSubmit={() => onApply(container)}
      onCancel={onClose}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!isValid}
    >
      <div className="flex flex-col px-6 py-4 gap-4 h-full">
        <ServingProperties
          container={container}
          setContainer={setContainer}
          route={route}
          names={names}
          isModal={true}
        />
      </div>
    </DialFormPopup>
  );
};

export default CreateServing;
