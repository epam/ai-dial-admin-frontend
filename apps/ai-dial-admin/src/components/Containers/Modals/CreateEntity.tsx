import { FC, useEffect, useState } from 'react';
import { ButtonVariant, DialButton, DialPopup, DialTextAreaField, DialTextInputField } from '@epam/ai-dial-ui-kit';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { getEntityTemplate } from '@/src/utils/deployments/entity';
import { FieldError } from '@/src/models/error';
import { getVersionControlError } from '@/src/utils/validation/version-error';
import { getErrorForDisplayName, getErrorForName } from '@/src/utils/validation/name-error';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { DialModel } from '@/src/models/dial/model';
import { Toolset } from '@/src/models/dial/toolset';
import { DialInterceptor } from '@/src/models/dial/interceptor';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onCreate: (entity: DialModel | Toolset | DialInterceptor) => void;
  container: Container;
  route: ApplicationRoute;
  names?: string[];
  transport?: CONTAINER_TRANSPORT;
}

const CreateEntityModal: FC<Props> = ({
  onClose,
  isModalOpen,
  modalTitle,
  names,
  onCreate,
  container,
  route,
  transport,
}) => {
  const t = useI18n() as (key: string) => string;

  const [entity, setEntity] = useState<DialModel | Toolset | DialInterceptor>(
    getEntityTemplate(route, container, t, transport),
  );
  const [nameError, setNameError] = useState<FieldError | null>(null);
  const [versionError, setVersionError] = useState<FieldError | null>(null);
  const [displayNameError, setDisplayNameError] = useState<FieldError | null>(null);
  const [descriptionError, setDescriptionError] = useState<FieldError | null>(null);

  useEffect(() => {
    if (route === ApplicationRoute.ModelDeployments) {
      setVersionError(getVersionControlError((entity as DialModel).displayVersion, true, false, t));
    }
    setNameError(getErrorForName(entity.name, names, t));
    setDisplayNameError(getErrorForDisplayName(entity.displayName, true, t));
    setDescriptionError(getErrorForDescription(entity.description, t));
  }, [entity, names, route, t]);

  return (
    <DialPopup
      onClose={onClose}
      title={modalTitle}
      portalId="CreateEntityModal"
      open={isModalOpen}
      className="flex flex-col lg:max-w-[55%] md:max-w-[75%]"
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4 gap-6">
        <DialTextInputField
          elementId="id"
          fieldTitle={t(EntityFieldsI18nKey.Id)}
          placeholder={t(EntityPlaceholdersI18nKey.Id)}
          value={entity.name}
          errorText={nameError?.text}
          invalid={!!nameError}
          onChange={(name?: string) => {
            setEntity({
              ...entity,
              name,
            });
          }}
        />
        <DialTextInputField
          elementId="displayName"
          fieldTitle={t(EntityFieldsI18nKey.DisplayName)}
          placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
          value={entity.displayName}
          errorText={displayNameError?.text}
          invalid={!!displayNameError}
          onChange={(displayName?: string) => {
            setEntity({
              ...entity,
              displayName,
            });
          }}
        />
        {route === ApplicationRoute.ModelDeployments && (
          <DialTextInputField
            elementId="version"
            fieldTitle={t(EntityFieldsI18nKey.Version)}
            placeholder={t(EntityPlaceholdersI18nKey.Version)}
            value={(entity as DialModel).displayVersion} //TODO: DEPLOYMENTS
            errorText={versionError?.text}
            invalid={!!versionError}
            optional={true}
            onChange={(displayVersion?: string) => {
              setEntity({
                ...entity,
                displayVersion,
              });
            }}
          />
        )}
        <DialTextAreaField
          elementClassName="min-h-[118px]"
          elementId="description"
          fieldTitle={t(EntityFieldsI18nKey.Description)}
          placeholder={t(EntityPlaceholdersI18nKey.Description)}
          value={entity.description}
          errorText={descriptionError?.text}
          invalid={!!descriptionError}
          optional={true}
          onChange={(description: string) => {
            setEntity({
              ...entity,
              description,
            });
          }}
        />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          label={t(ButtonsI18nKey.Create)}
          disabled={!(entity?.name && entity.displayName) || !!nameError || !!displayNameError || !!descriptionError}
          onClick={() => {
            onCreate(entity);
            onClose();
          }}
        />
      </div>
    </DialPopup>
  );
};

export default CreateEntityModal;
