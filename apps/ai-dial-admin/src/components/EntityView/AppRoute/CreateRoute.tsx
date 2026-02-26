import { DialFormPopup, DialInput, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateEntityTitle } from '@/src/utils/entities/create-entity';
import { getErrorForName } from '@/src/utils/validation/name-error';

interface Props {
  isModalOpen: boolean;
  routeNames?: string[];
  onCreate: (name: string) => void;
  onClose: () => void;
}

const CreateRoute: FC<Props> = ({ isModalOpen, routeNames, onClose, onCreate }) => {
  const t = useI18n();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<FieldError | null>(null);

  const validateName = useCallback(
    (name?: string) => {
      const error = getErrorForName(name, routeNames, t, false, false, true);
      setNameError(error);
    },
    [routeNames, t],
  );

  const onChangeName = useCallback(
    (name?: string) => {
      const trimmedValue = name?.trimStart() || '';
      setName(trimmedValue);
      validateName(trimmedValue);
    },
    [validateName],
  );

  return (
    <DialFormPopup
      onClose={onClose}
      header={getCreateEntityTitle(ApplicationRoute.Routes, t)}
      submitLabel={t(ButtonsI18nKey.Create)}
      size={PopupSize.Sm}
      onSubmit={() => {
        onCreate(name);
        setName('');
      }}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
      disableSubmitButton={!name || !!nameError}
      portalId="CreateRoute"
      open={isModalOpen}
    >
      <div className="flex flex-col overflow-auto px-6 py-4">
        <DialInput
          id="name"
          labelProps={{ label: t(EntityFieldsI18nKey.displayName) }}
          placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
          value={name}
          onChange={onChangeName}
          invalid={!!nameError}
          error={nameError?.text}
        />
      </div>
    </DialFormPopup>
  );
};

export default CreateRoute;
