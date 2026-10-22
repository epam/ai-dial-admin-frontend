'use client';

import { FC, useState } from 'react';
import { Popup } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { CONTAINER_SOURCE_TYPE, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ContainerTemplateOptions, getContainerTemplate } from '@/src/utils/deployments/containers';
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
  sourceType?: CONTAINER_SOURCE_TYPE;
  templateOptions?: ContainerTemplateOptions;
}

const ServingCreate: FC<Props> = ({
  isModalOpen,
  onClose,
  onApply,
  route,
  names,
  header,
  type,
  sourceType,
  templateOptions,
}) => {
  const t = useI18n();
  const { resourcesDefaults } = useAppContext();
  const { isValid } = useSaveValidationContext();

  const [container, setContainer] = useState<Container>(
    getContainerTemplate(type, resourcesDefaults, sourceType, templateOptions) as Container,
  );

  return (
    <Popup
      portalId="ServingCreateModal"
      open={isModalOpen}
      header={header}
      onClose={onClose}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Create),
        isSubmitDisabled: !isValid,
        onCancel: onClose,
        onSubmit: () => onApply(container),
      })}
    >
      <div className="flex flex-col px-6 py-4 gap-4 h-full">
        <ContainerFields container={container} setContainer={setContainer} route={route} names={names} isModal={true} />
      </div>
    </Popup>
  );
};

export default ServingCreate;
